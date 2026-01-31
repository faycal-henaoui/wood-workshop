/**
 * Database Debugger
 * Runs diagnostic queries to verify data relations (Invoices -> Items -> Products).
 * Useful for troubleshooting "missing stats" or empty dashboards.
 */
const pool = require('./db');

async function debug() {
  try {
    console.log('--- Debugging Dashboard Query ---');

    // 1. Check Invoices for Today
    const invoices = await pool.query(
      "SELECT id, invoice_number, created_at FROM invoices ORDER BY created_at DESC LIMIT 5"
    );
    console.log(`Recent Invoices (${invoices.rows.length}):`);
    invoices.rows.forEach(inv => console.log(` - #${inv.invoice_number} (${inv.created_at})`));

    /*
    if (invoices.rows.length === 0) {
      console.log('No invoices found for today.');
      return;
    }
    */

    // 2. Check Invoice Items for these invoices
    const invoiceIds = invoices.rows.map(inv => `'${inv.id}'`).join(',');
    const items = await pool.query(
      `SELECT id, invoice_id, product_id, description, quantity FROM invoice_items WHERE invoice_id IN (${invoiceIds})`
    );
    console.log(`\nInvoice Items (${items.rows.length}):`);
    items.rows.forEach(item => console.log(` - Item: ${item.description}, Product ID: ${item.product_id}, Qty: ${item.quantity}`));

    // 3. Check Product Materials for these products
    const productIds = items.rows
      .filter(item => item.product_id)
      .map(item => `'${item.product_id}'`)
      .join(',');

    if (!productIds) {
      console.log('\nNo products linked to these invoice items (all custom items?).');
    } else {
      const materials = await pool.query(
        `SELECT * FROM product_materials WHERE product_id IN (${productIds})`
      );
      console.log(`\nProduct Materials Found (${materials.rows.length}):`);
      materials.rows.forEach(pm => console.log(` - Product: ${pm.product_id}, Material: ${pm.material_id}, Qty: ${pm.quantity_required}`));
    }

    // 4. List All Products
    const allProducts = await pool.query('SELECT id, name FROM products');
    console.log(`\nAll Products (${allProducts.rows.length}):`);
    allProducts.rows.forEach(p => console.log(` - ${p.name} (${p.id})`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    // pool.end(); // Don't close if using a shared pool that might hang, but here it's a script.
    process.exit();
  }
}

debug();