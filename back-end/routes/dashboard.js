const router = require('express').Router();
const pool = require('../db');

/**
 * Get Dashboard Stats
 * Aggregates all key performance indicators (KPIs) for the dashboard.
 * Returns: Total stock value, Low stock items, Monthly orders/revenue, Recent activity.
 */
router.get('/', async (req, res) => {
  try {
    // 1. Total Stock Value
    const stockValueQuery = await pool.query(
      'SELECT SUM(quantity * price) as total_value FROM materials'
    );
    const totalStockValue = stockValueQuery.rows[0].total_value || 0;

    // 2. Low Stock Materials (Count & List)
    const lowStockQuery = await pool.query(
      'SELECT name, quantity, unit FROM materials WHERE quantity <= low_stock_threshold LIMIT 5'
    );
    const lowStockItems = lowStockQuery.rows;

    // 3. Orders This Month
    const ordersMonthQuery = await pool.query(
      `SELECT COUNT(*) as count FROM invoices 
       WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`
    );
    const ordersThisMonth = ordersMonthQuery.rows[0].count;

    // 4. Revenue This Month
    const revenueMonthQuery = await pool.query(
      `SELECT SUM(total_amount) as total FROM invoices 
       WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`
    );
    const revenueThisMonth = revenueMonthQuery.rows[0].total || 0;

    // 5. Recent Invoices
    const recentInvoicesQuery = await pool.query(
      `SELECT i.invoice_number, c.name as client_name, i.created_at, i.total_amount 
       FROM invoices i 
       JOIN clients c ON i.client_id = c.id 
       ORDER BY i.created_at DESC LIMIT 5`
    );
    const recentInvoices = recentInvoicesQuery.rows;

    // 6. Today's Activity (Orders created today)
    const todayOrdersQuery = await pool.query(
      `SELECT COUNT(*) as count FROM invoices 
       WHERE date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE)`
    );
    const ordersToday = todayOrdersQuery.rows[0].count;

    // 7. Most Used Material Today
    const mostUsedMaterialQuery = await pool.query(
      `SELECT name, unit, SUM(total_used) as total_used FROM (
          -- 1. From Product Recipes
          SELECT m.name, m.unit, (pm.quantity_required * ii.quantity) as total_used
          FROM invoices i
          JOIN invoice_items ii ON i.id = ii.invoice_id
          JOIN product_materials pm ON ii.product_id = pm.product_id
          JOIN materials m ON pm.material_id = m.id
          WHERE date_trunc('day', i.created_at) = date_trunc('day', CURRENT_DATE)

          UNION ALL

          -- 2. From Direct Material Sales (Custom Items matching Material Name)
          SELECT m.name, m.unit, ii.quantity as total_used
          FROM invoices i
          JOIN invoice_items ii ON i.id = ii.invoice_id
          JOIN materials m ON LOWER(ii.description) = LOWER(m.name)
          WHERE date_trunc('day', i.created_at) = date_trunc('day', CURRENT_DATE)
          AND ii.product_id IS NULL
      ) as combined_usage
      GROUP BY name, unit
      ORDER BY total_used DESC
      LIMIT 1`
    );
    const mostUsedMaterial = mostUsedMaterialQuery.rows[0] || null;

    // 8. Active Projects (Pending Invoices)
    const activeProjectsQuery = await pool.query(
      `SELECT COUNT(*) as count FROM invoices WHERE status = 'Pending' AND type = 'invoice'`
    );
    const activeProjects = activeProjectsQuery.rows[0].count;

    // 9. Pending Payments (Total Unpaid Amount)
    const pendingPaymentsQuery = await pool.query(
      `SELECT SUM(total_amount) as total FROM invoices WHERE status = 'Pending' AND type = 'invoice'`
    );
    const pendingPayments = pendingPaymentsQuery.rows[0].total || 0;

    res.json({
      totalStockValue,
      lowStockItems,
      ordersThisMonth,
      revenueThisMonth,
      recentInvoices,
      ordersToday,
      mostUsedMaterial,
      activeProjects,
      pendingPayments
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get Revenue & Orders Breakdown for Current Month
router.get('/breakdown', async (req, res) => {
  try {
    const query = `
      WITH days AS (
          SELECT generate_series(
              date_trunc('month', CURRENT_DATE)::timestamp,
              (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::timestamp,
              '1 day'::interval
          )::date AS day
      )
      SELECT 
          to_char(d.day, 'YYYY-MM-DD') as date,
          to_char(d.day, 'DD') as day_label,
          COALESCE(SUM(i.total_amount), 0) as revenue,
          COUNT(i.id) as orders
      FROM days d
      LEFT JOIN invoices i ON i.created_at::date = d.day
      GROUP BY d.day
      ORDER BY d.day;
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
