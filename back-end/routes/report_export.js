const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET Monthly Detailed Report
 * Returns all Invoices and Purchases for a specific month/year.
 * Query Params: month (1-12), year (e.g. 2026)
 */
router.get('/detailed', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Validate inputs
    if (!month || !year) {
        return res.status(400).json({ error: 'Month and Year required' });
    }

    // --- 1. Fetch Sales Invoices ---
    // Matches standard SQL date functions: EXTRACT(MONTH FROM date)
    const invoicesResult = await pool.query(`
      SELECT 
        id, 
        invoice_number, 
        client_name, 
        total_amount, 
        labor_cost, 
        status, 
        created_at 
      FROM invoices
      WHERE 
        EXTRACT(MONTH FROM created_at) = $1 AND 
        EXTRACT(YEAR FROM created_at) = $2
      ORDER BY created_at ASC
    `, [month, year]);

    // --- 2. Fetch Purchases ---
    const purchasesResult = await pool.query(`
      SELECT 
        id, 
        supplier_name, 
        description,
        total_amount, 
        purchase_date 
      FROM purchases
      WHERE 
        EXTRACT(MONTH FROM purchase_date) = $1 AND 
        EXTRACT(YEAR FROM purchase_date) = $2
      ORDER BY purchase_date ASC
    `, [month, year]);

    // Calculate Totals using Javascript to ensure consistency with what we return
    const sales = invoicesResult.rows;
    const purchases = purchasesResult.rows;

    // Financial calculations
    const total_sales_paid = sales
        .filter(i => i.status === 'Paid')
        .reduce((sum, i) => sum + Number(i.total_amount), 0);
        
    const total_sales_pending = sales
        .filter(i => i.status === 'Pending')
        .reduce((sum, i) => sum + Number(i.total_amount), 0);
        
    const total_labor = sales.reduce((sum, i) => sum + Number(i.labor_cost), 0);
    
    const total_expenses = purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);

    const net_profit = total_sales_paid - total_expenses;

    res.json({
        period: `${month}-${year}`,
        sales,
        purchases,
        summary: {
            total_paid: total_sales_paid.toFixed(2),
            total_pending: total_sales_pending.toFixed(2),
            total_purchased: total_expenses.toFixed(2),
            total_labor: total_labor.toFixed(2),
            net_profit: net_profit.toFixed(2)
        }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
