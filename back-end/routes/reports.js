const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET Monthly Revenue (Dynamic Range)
 * Calculates revenue by grouping invoices by month (YYYY-MM).
 * Accepts 'months' query param to set lookback period.
 */
router.get('/revenue', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const result = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month_key, SUM(total_amount) as revenue
      FROM invoices
      WHERE created_at > NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month_key
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * GET Most Used Materials (Current Month)
 * Analyzes invoice items to determine top selling products/materials.
 * Used for the "Activity" chart.
 */
router.get('/materials', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ii.description as name, SUM(ii.quantity) as val
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY ii.description
      ORDER BY val DESC
      LIMIT 4
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * GET Top Clients
 * Lists clients based on either:
 * 1. Number of Invoices ('invoices')
 * 2. Total Revenue Generated ('revenue')
 */
router.get('/clients', async (req, res) => {
  try {
    const { sortBy } = req.query; // 'revenue' or 'invoices'
    const orderBy = sortBy === 'invoices' ? 'invoices DESC' : 'total_spent DESC';

    const result = await pool.query(`
      SELECT c.name, COUNT(i.id) as invoices, SUM(i.total_amount) as total_spent
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      GROUP BY c.name
      ORDER BY ${orderBy}
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * GET General Stats (Profit, etc.)
 * Calculates High-Level Financial Metrics over a period:
 * - Revenue (Total Invoice Amount)
 * - Profit (Revenue - Labor Cost) - *Note: Material cost calculation logic resides elsewhere*
 * - Margin %
 */
router.get('/stats', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    
    // Total Revenue (Filtered by date)
    const revenueRes = await pool.query(`
      SELECT SUM(total_amount) 
      FROM invoices 
      WHERE created_at > NOW() - INTERVAL '${months} months'
    `);
    const totalRevenue = parseFloat(revenueRes.rows[0].sum || 0);

    // Total Profit (Based on Labor Cost)
    const profitRes = await pool.query(`
      SELECT SUM(labor_cost) 
      FROM invoices 
      WHERE created_at > NOW() - INTERVAL '${months} months'
    `);
    const profit = parseFloat(profitRes.rows[0].sum || 0);

    // Total Cost (Revenue - Profit)
    const totalCost = totalRevenue - profit;

    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

    res.json({
      revenue: totalRevenue,
      cost: totalCost,
      profit: profit,
      margin: profitMargin
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET Detailed Financials (Professional Report)
router.get('/financials', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const status = req.query.status || 'All'; // 'All', 'Paid', 'Pending'

    // Helper condition for status
    const statusCondition = status === 'All' 
        ? "1=1" 
        : `status = '${status}'`;

    // 1. Total Invoiced Revenue (Gross Sales)
    const revenueRes = await pool.query(`
      SELECT SUM(total_amount) as total, SUM(labor_cost) as labor
      FROM invoices
      WHERE created_at > NOW() - INTERVAL '${months} months'
      AND ${statusCondition}
    `);
    const totalRevenue = parseFloat(revenueRes.rows[0].total || 0);
    const laborRevenue = parseFloat(revenueRes.rows[0].labor || 0);

    // 2. Purchasing (Cash Outflow) - Purchases don't have a status in current DB, considered always "Paid/Committed"
    const purchaseRes = await pool.query(`
        SELECT SUM(total_amount) 
        FROM purchases 
        WHERE purchase_date > NOW() - INTERVAL '${months} months'
    `);
    const totalPurchases = parseFloat(purchaseRes.rows[0].sum || 0);

    // 3. Estimated Cost of Goods Sold (COGS) based on Materials Used in Invoices
    // Formula: Sum(InvoiceItemQty * ProductMaterialQty * MaterialCurrentPrice)
    const cogsRes = await pool.query(`
        SELECT SUM(ii.quantity * pm.quantity_required * m.price) as cogs
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        JOIN product_materials pm ON ii.product_id = pm.product_id
        JOIN materials m ON pm.material_id = m.id
        WHERE i.created_at > NOW() - INTERVAL '${months} months'
        AND ${statusCondition}
    `);
    const estimatedCOGS = parseFloat(cogsRes.rows[0].cogs || 0);
    
    // 4. Calculations
    // Material Profit = (Total Revenue - Labor Revenue) - COGS
    // We assume (Total Revenue - Labor) is the "Price of Goods Sold".
    const goodsRevenue = totalRevenue - laborRevenue; 
    const materialProfit = goodsRevenue - estimatedCOGS;
    
    // Total Net Profit = Labor Revenue + Material Profit
    const netProfit = laborRevenue + materialProfit;

    // 5. Monthly Breakdown for Charts (Fixed with generate_series to show all months)
    const monthlyRes = await pool.query(`
        WITH months_series AS (
            SELECT generate_series(
                date_trunc('month', NOW() - INTERVAL '${months} months'),
                date_trunc('month', NOW()),
                '1 month'::interval
            ) as m_date
        ),
        monthly_invoices AS (
            SELECT 
                date_trunc('month', created_at) as m_date,
                SUM(total_amount) as revenue,
                SUM(labor_cost) as labor
            FROM invoices
            WHERE created_at > NOW() - INTERVAL '${months} months'
            AND ${statusCondition}
            GROUP BY 1
        ),
        monthly_purchases AS (
            SELECT 
                date_trunc('month', purchase_date) as m_date,
                SUM(total_amount) as cost
            FROM purchases
            WHERE purchase_date > NOW() - INTERVAL '${months} months'
            GROUP BY 1
        )
        SELECT 
            TO_CHAR(ms.m_date, 'Mon YYYY') as month,
            COALESCE(i.revenue, 0) as revenue,
            COALESCE(i.labor, 0) as labor,
            COALESCE(p.cost, 0) as purchases_cost
        FROM months_series ms
        LEFT JOIN monthly_invoices i ON ms.m_date = i.m_date
        LEFT JOIN monthly_purchases p ON ms.m_date = p.m_date
        ORDER BY ms.m_date ASC
    `);

    res.json({
        summary: {
            revenue: totalRevenue,
            labor_income: laborRevenue,
            material_profit: materialProfit,
            cogs: estimatedCOGS,
            net_profit: netProfit,
            purchases_cashflow: totalPurchases
        },
        chart_data: monthlyRes.rows
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
