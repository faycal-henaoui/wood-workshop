const router = require('express').Router();
const pool = require('../db');

/**
 * Get Purchase History
 * Fetches a list of all past purchase orders.
 */
router.get('/', async (req, res) => {
  try {
    const history = await pool.query('SELECT * FROM purchases ORDER BY purchase_date DESC');
    res.json(history.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Get Single Purchase Details
 * Fetches details + line items for a specific purchase order.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get Purchase Info
    const purchase = await pool.query('SELECT * FROM purchases WHERE id = $1', [id]);
    if (purchase.rows.length === 0) return res.status(404).json({ msg: 'Purchase not found' });

    // Get Items
    const items = await pool.query(
      `SELECT pi.*, m.name as material_name 
       FROM purchase_items pi
       JOIN materials m ON pi.material_id = m.id
       WHERE pi.purchase_id = $1`,
      [id]
    );

    res.json({ ...purchase.rows[0], items: items.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Record New Purchase (Restock)
 * Performs a complex transaction:
 * 1. Creates a purchase record.
 * 2. Creates new materials if they don't exist ("isNew" flag).
 * 3. Records purchase line items.
 * 4. Updates Stock Quantity in `materials` table.
 * 5. Updates Material Price using Weighted Average Cost (WAC) formula.
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // supplier_name is just a string for now, could be a table later
    const { supplier_name, items, purchase_date } = req.body; 
    
    // 1. Create Purchase Record
    // We calculate total automatically based on the items
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    
    // Use submitted date or default to NOW
    const dateToStore = purchase_date || new Date();

    const newPurchase = await client.query(
      `INSERT INTO purchases (supplier_name, total_amount, purchase_date) 
       VALUES ($1, $2, $3) RETURNING *`,
      [supplier_name, totalAmount, dateToStore]
    );
    const purchaseId = newPurchase.rows[0].id;

    // 2. Process Each Item
    for (const item of items) {
      let materialId = item.id; // Could be null if new
      let currentQty = 0;
      let currentPrice = 0;

      // Handle New Material Creation
      if (item.isNew && !materialId) {
         // Defaults for new material if not fully specified
         const newMat = await client.query(
          `INSERT INTO materials (name, type, quantity, unit, price, low_stock_threshold, length, width) 
           VALUES ($1, $2, 0, $3, 0, 10, 0, 0) RETURNING id`, // Start with 0 qty/price, we update below
          [item.name, item.type || 'Standard', item.unit || 'pcs']
         );
         materialId = newMat.rows[0].id;
      }

      // Record Purchase Item
      await client.query(
        `INSERT INTO purchase_items (purchase_id, material_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [purchaseId, materialId, item.quantity, item.unit_price]
      );

      // 3. Update Stock & Calculate WAC (Weighted Average Cost)
      // First get current state (locked for update)
      const currentMatRes = await client.query('SELECT quantity, price FROM materials WHERE id = $1', [materialId]);
      
      if (currentMatRes.rows.length > 0) {
          const m = currentMatRes.rows[0];
          const oldQty = Number(m.quantity);
          const oldPrice = Number(m.price);
          const newQty = Number(item.quantity);
          const purchasePrice = Number(item.unit_price);

          // WAC Formula:
          // NewPrice = ((OldQty * OldPrice) + (NewQty * PurchasePrice)) / (OldQty + NewQty)
          const totalVal = (oldQty * oldPrice) + (newQty * purchasePrice);
          const totalQty = oldQty + newQty;
          
          let newWAC = 0;
          if (totalQty > 0) {
              newWAC = totalVal / totalQty;
          }

          // Update Material
          await client.query(
              'UPDATE materials SET quantity = $1, price = $2 WHERE id = $3',
              [totalQty, newWAC, materialId]
          );
      }
    }

    await client.query('COMMIT');
    res.json({ msg: 'Stock updated successfully', purchase: newPurchase.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

module.exports = router;
