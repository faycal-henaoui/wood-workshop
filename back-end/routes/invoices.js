const router = require('express').Router();
const pool = require('../db');

/**
 * HELPER: Stock Verification Logic
 * Checks if there is enough raw material in stock to fulfill the ordered items.
 * 
 * @param {Object} client - Database client for transactions
 * @param {Array} items - List of items in the invoice/quote
 * @returns {Array} errors - List of error messages (empty if stock is sufficient)
 */
const verifyStockForItems = async (client, items) => {
    // Map to aggregate total requirements per material
    // Key: material_id, Value: total_quantity_needed
    const requirements = {};
    const productNames = {}; // For error reporting

    // 1. Calculate Requirements
    for (const item of items) {
        const { product_id, material_id, quantity } = item;
        // Ensure quantity is a number
        const qty = parseFloat(quantity);

        if (product_id) {
            // Fetch recipe
            const recipe = await client.query(
                `SELECT pm.material_id, pm.quantity_required, m.name as mat_name
                 FROM product_materials pm
                 JOIN materials m ON pm.material_id = m.id
                 WHERE pm.product_id = $1`,
                [product_id]
            );

            for (const ing of recipe.rows) {
                const totalNeeded = parseFloat(ing.quantity_required) * qty;
                if (!requirements[ing.material_id]) {
                    requirements[ing.material_id] = { qty: 0, name: ing.mat_name };
                }
                requirements[ing.material_id].qty += totalNeeded;
            }
        } else if (material_id) {
            // Direct Material
            if (!requirements[material_id]) {
                // We need to fetch name if not yet known, but we can do it later or now.
                // Let's optimize by trusting ID existence or fetching name in bulk check.
                requirements[material_id] = { qty: 0, name: 'Unknown Material' };
            }
            requirements[material_id].qty += qty;
        }
    }

    // 2. Check Requirement against Stock
    const errors = [];
    const matIds = Object.keys(requirements);

    if (matIds.length > 0) {
        // Fetch current stock
        // We use ANY($1) for passing array
        const stockRes = await client.query(
            'SELECT id, name, quantity FROM materials WHERE id = ANY($1)',
            [matIds]
        );

        const stockMap = {};
        stockRes.rows.forEach(row => {
            stockMap[row.id] = row;
        });

        for (const matId of matIds) {
            const req = requirements[matId];
            const stock = stockMap[matId];

            if (!stock) {
                errors.push(`Material ID ${matId} not found in database.`);
                continue;
            }

            // Update name for better error message
            req.name = stock.name;

            if (stock.quantity < req.qty) {
                errors.push(`Insufficient stock for "${stock.name}". Required: ${req.qty.toFixed(2)}, Available: ${stock.quantity}.`);
            }
        }
    }

    return errors;
};

/**
 * HELPER: Stock Deduction Logic
 * Deducts the calculated quantities from the main stock or scrap inventory.
 * Uses complex logic to prioritize using scrap pieces for sheet materials before cutting new full sheets.
 * 
 * @param {Object} client - Database client
 * @param {String} invoiceNumber - Reference for logging
 * @param {Array} items - Items to process
 */
const deductStockForItems = async (client, invoiceNumber, items) => {
  
  // Internal helper to deduct a specific material amount
  const deductMaterial = async (matId, amountToDeduct, isSheet, cutL, cutW) => {
    let stockDeducted = false;
    let matInfo = null;

    if (isSheet) {
      let potentialScrap = null;
      let useDimensionalMatching = false;

      // 0. Get Material Info (Dims) if needed
      if (cutL > 0 && cutW > 0) {
        matInfo = await client.query('SELECT length, width FROM materials WHERE id = $1', [matId]);
        if (matInfo.rows.length > 0) {
          useDimensionalMatching = true;
        }
      }

      // 1. Try to find suitable scrap
      // Priority: Dimensional Match
      if (useDimensionalMatching) {
        const dimCheck = await client.query(
          `SELECT id, quantity, length, width FROM scrap_materials 
           WHERE material_id = $1 
           AND length >= $2 AND width >= $3 
           ORDER BY (length * width) ASC LIMIT 1`,
          [matId, cutL, cutW]
        );
        if (dimCheck.rows.length > 0) {
          potentialScrap = dimCheck.rows[0];
        }
      }

      // Fallback: Area Match
      if (!potentialScrap && !useDimensionalMatching) {
        const areaCheck = await client.query(
          'SELECT id, quantity FROM scrap_materials WHERE material_id = $1 AND quantity >= $2 ORDER BY quantity ASC LIMIT 1',
          [matId, amountToDeduct]
        );
        if (areaCheck.rows.length > 0) {
          potentialScrap = areaCheck.rows[0];
        }
      }

      if (potentialScrap) {
        // --> USE SCRAP
        if (useDimensionalMatching && potentialScrap.length > 0) {
          // Dimensional Consumption Logic
          const sL = parseFloat(potentialScrap.length);
          const sW = parseFloat(potentialScrap.width);

          const remL = sL - parseFloat(cutL);
          const remW = sW - parseFloat(cutW);

          const tolerance = 5;
          const consumedCondition = remL < tolerance && remW < tolerance;

          if (consumedCondition) {
            await client.query('DELETE FROM scrap_materials WHERE id = $1', [potentialScrap.id]);
          } else {
            const finalL = remL > 0 ? remL : 0;
            const finalW = remW > 0 ? remW : 0;

            if (finalL < 10 || finalW < 10) {
              await client.query('DELETE FROM scrap_materials WHERE id = $1', [potentialScrap.id]);
            } else {
              let matInf = matInfo;
              if (!matInf) matInf = await client.query('SELECT length, width FROM materials WHERE id = $1', [matId]);

              let newQty = 0;
              if (matInf.rows.length > 0) {
                const baseL = parseFloat(matInf.rows[0].length);
                const baseW = parseFloat(matInf.rows[0].width);
                newQty = (finalL * finalW) / (baseL * baseW);
              }

              const dimLabel = `${finalL} x ${finalW}`;
              await client.query(
                'UPDATE scrap_materials SET quantity = $1, dimensions = $2, length = $3, width = $4 WHERE id = $5',
                [newQty.toFixed(4), dimLabel, finalL, finalW, potentialScrap.id]
              );
            }
          }
        } else {
          // Fallback Area-based Consumption
          const newScrapQty = parseFloat(potentialScrap.quantity) - amountToDeduct;
          if (newScrapQty < 0.001) {
            await client.query('DELETE FROM scrap_materials WHERE id = $1', [potentialScrap.id]);
          } else {
            await client.query('UPDATE scrap_materials SET quantity = $1 WHERE id = $2', [newScrapQty.toFixed(2), potentialScrap.id]);
          }
        }
        stockDeducted = true;
      }
    }

    // 2. If not handled by scrap, use Main Stock
    if (!stockDeducted) {
      if (isSheet) {
        await client.query(
          'UPDATE materials SET quantity = quantity - $1 WHERE id = $2',
          [amountToDeduct, matId]
        );

        // Generate New Scrap from Offcuts
        if (cutL > 0 && cutW > 0) {
          if (!matInfo) matInfo = await client.query('SELECT length, width FROM materials WHERE id = $1', [matId]);

          if (matInfo && matInfo.rows.length > 0) {
            const sheetL = parseFloat(matInfo.rows[0].length);
            const sheetW = parseFloat(matInfo.rows[0].width);

            const remL = sheetL - parseFloat(cutL);
            const remW = sheetW - parseFloat(cutW);

            if (remL > 10 && remW > 10) {
              const dimString = `${remL} x ${remW}`;
              const scrapQty = (remL * remW) / (sheetL * sheetW);

              await client.query(
                'INSERT INTO scrap_materials (material_id, quantity, dimensions, notes, length, width) VALUES ($1, $2, $3, $4, $5, $6)',
                [matId, scrapQty.toFixed(4), dimString, `Offcut from Invoice #${String(invoiceNumber).padStart(6, '0')}`, remL, remW]
              );
            }
          }
        }
      } else {
        // Standard Item
        await client.query(
          'UPDATE materials SET quantity = quantity - $1 WHERE id = $2',
          [amountToDeduct, matId]
        );
      }
    }
  };

  // Main Item Loop
  for (const item of items) {
    const { product_id, material_id, quantity, width, height } = item;
    // Note: 'quantity' passed here should be the BILLED quantity (e.g. 1 sheet), not fractional usage.

    if (product_id) {
      // 1. Fetch Product Recipe
      const recipe = await client.query(
        `SELECT pm.material_id, pm.quantity_required, pm.cut_length, pm.cut_width, m.type 
         FROM product_materials pm
         JOIN materials m ON pm.material_id = m.id
         WHERE pm.product_id = $1`,
        [product_id]
      );

      if (recipe.rows.length > 0) {
        for (const ing of recipe.rows) {
          const totalNeeded = parseFloat(ing.quantity_required) * parseFloat(quantity);
          const isSheet = ing.type === 'Sheet';
          const cL = parseFloat(ing.cut_length || 0);
          const cW = parseFloat(ing.cut_width || 0);

          await deductMaterial(ing.material_id, totalNeeded, isSheet, cL, cW);
        }
      }

    } else if (material_id) {
      // 2. Custom Item
      // We need to determine if it is a sheet material to enable scrap logic
      const matCheck = await client.query('SELECT type FROM materials WHERE id = $1', [material_id]);
      const isSheet = matCheck.rows.length > 0 && matCheck.rows[0].type === 'Sheet';
      
      await deductMaterial(material_id, parseFloat(quantity), isSheet, parseFloat(height || 0), parseFloat(width || 0));
    }
  }
};


// Create Invoice (or Quote)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { client_name, items, total_amount, labor_cost, type } = req.body;
    // type defaults to 'invoice' unless 'quote' is specified

    const invoiceType = type === 'quote' ? 'quote' : 'invoice';
    const invoiceStatus = invoiceType === 'quote' ? 'Draft' : 'Pending';

    // 1. Handle Client (Find or Create)
    let client_id;
    const clientCheck = await client.query('SELECT id FROM clients WHERE name = $1', [client_name]);
    
    if (clientCheck.rows.length > 0) {
      client_id = clientCheck.rows[0].id;
    } else {
      const newClient = await client.query(
        'INSERT INTO clients (name) VALUES ($1) RETURNING id',
        [client_name]
      );
      client_id = newClient.rows[0].id;
    }

    // 2. Create Invoice Record
    // Ensure 'type' column exists in DB logic
    const invoiceRes = await client.query(
      'INSERT INTO invoices (client_id, total_amount, labor_cost, status, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [client_id, total_amount, labor_cost || 0, invoiceStatus, invoiceType]
    );
    const invoice = invoiceRes.rows[0];

    // 3. Process Items (Insert and maybe Deduct)
    const itemsForDeduction = [];

    for (const item of items) {
      const { material_id, description, quantity_used, unit_price, is_sheet_material, cut_length, cut_width } = item;
      
      const qtyUsedNum = parseFloat(quantity_used);
      let quantity_billed = qtyUsedNum;
      
      // Calculate Billing Quantity (Customer pays for full sheets typically)
      if (is_sheet_material) {
        quantity_billed = Math.ceil(qtyUsedNum); 
      }

      const total_price = quantity_billed * unit_price;

      const width = cut_width || 0;
      const height = cut_length || 0;

      // A. Add to Invoice Items
      await client.query(
        'INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price, material_id, width, height) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [invoice.id, item.product_id || null, description, quantity_billed, unit_price, total_price, material_id || null, width, height]
      );

      // Prepare for deduction
      itemsForDeduction.push({
        product_id: item.product_id || null,
        material_id: material_id || null,
        quantity: quantity_billed,
        width: width,
        height: height
      });
    }

    // 4. Deduct Stock IF Invoice
    if (invoiceType === 'invoice') {
      // VERIFY STOCK FIRST
      const stockErrors = await verifyStockForItems(client, itemsForDeduction);
      if (stockErrors.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: "Stock Validation Failed", errors: stockErrors });
      }

      await deductStockForItems(client, invoice.invoice_number, itemsForDeduction);
    }

    await client.query('COMMIT');

    res.json(invoice);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

// Convert Quote to Invoice
router.put('/:id/convert', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get current status
    const invCheck = await client.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json('Invoice not found');
    }
    const invoice = invCheck.rows[0];

    if (invoice.type !== 'quote') {
      await client.query('ROLLBACK');
      return res.status(400).json('Invoice is already processed (not a quote).');
    }

    // 2. Update Status
    await client.query(
      "UPDATE invoices SET type = 'invoice', status = 'Pending' WHERE id = $1",
      [id]
    );

    // 3. Get Items
    const itemsRes = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
    const items = itemsRes.rows;

    // 4. Run Stock Deduction
    // First, map items to format expected by verifyStockForItems
    // Note: invoice_items table columns: product_id, material_id, quantity ...
    const itemsForCheck = items.map(i => ({
        product_id: i.product_id,
        material_id: i.material_id,
        quantity: i.quantity
    }));

    // VERIFY STOCK FIRST
    const stockErrors = await verifyStockForItems(client, itemsForCheck);
    if (stockErrors.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: "Stock Validation Failed", errors: stockErrors });
    }

    // Items from DB have 'width' and 'height' columns now
    await deductStockForItems(client, invoice.invoice_number, items);

    await client.query('COMMIT');
    res.json({ message: 'Converted to Invoice and stock deducted', id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

/**
 * GET All Invoices
 * Fetches all invoices from the database.
 * Joins with the Client table to return the client's name.
 * Default sort is by creation date (newest first).
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * GET Invoice Details by ID
 * Fetches proper details for a single invoice.
 * Includes Client Info (Name, Address, Phone) for printing.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get Invoice & Client Info
    const invoiceQuery = await pool.query(`
      SELECT i.*, c.name as client_name, c.address as client_address, c.phone as client_phone
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.id = $1
    `, [id]);

    if (invoiceQuery.rows.length === 0) {
      return res.status(404).json('Invoice not found');
    }

    // 2. Get Invoice Items
    const itemsQuery = await pool.query(`
      SELECT * FROM invoice_items WHERE invoice_id = $1
    `, [id]);

    // 3. Get Shop Settings (for header)
    const settingsQuery = await pool.query('SELECT * FROM settings LIMIT 1');
    const settings = settingsQuery.rows[0] || {};

    res.json({
      ...invoiceQuery.rows[0],
      items: itemsQuery.rows,
      settings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Invoice Status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Paid', 'Pending', 'Cancelled'
    
    await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Invoice Payment Method
router.put('/:id/payment-method', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;
    
    await pool.query('UPDATE invoices SET payment_method = $1 WHERE id = $2', [payment_method, id]);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Quote (Only if type='quote')
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { client_name, items, total_amount, labor_cost } = req.body;

    // 1. Check if Quote
    const invCheck = await client.query('SELECT type FROM invoices WHERE id = $1', [id]);
    if (invCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json('Invoice not found');
    }
    if (invCheck.rows[0].type !== 'quote') {
        await client.query('ROLLBACK');
        return res.status(400).json('Cannot update a processed invoice. Only Quotes can be edited.');
    }

    // 2. Handle Client
    let client_id;
    const clientDb = await client.query('SELECT id FROM clients WHERE name = $1', [client_name]);
    if (clientDb.rows.length > 0) client_id = clientDb.rows[0].id;
    else {
        const newC = await client.query('INSERT INTO clients (name) VALUES ($1) RETURNING id', [client_name]);
        client_id = newC.rows[0].id;
    }

    // 3. Update Invoice Header
    await client.query(
        'UPDATE invoices SET client_id = $1, total_amount = $2, labor_cost = $3 WHERE id = $4',
        [client_id, total_amount, labor_cost || 0, id]
    );

    // 4. Replace Items
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    for (const item of items) {
      const { material_id, description, quantity_used, unit_price, is_sheet_material, cut_length, cut_width } = item;
      
      const qtyUsedNum = parseFloat(quantity_used);
      let quantity_billed = qtyUsedNum;
      
      if (is_sheet_material) quantity_billed = Math.ceil(qtyUsedNum);

      const total_price = quantity_billed * unit_price;
      const width = cut_width || 0;
      const height = cut_length || 0;

      await client.query(
        'INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price, material_id, width, height) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, item.product_id || null, description, quantity_billed, unit_price, total_price, material_id || null, width, height]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Quote Updated Successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

// Delete Invoice
router.delete('/:id', async (req, res) => {
  try {
     const { id } = req.params;
     // Note: If we delete an invoice, should we RESTORE stock?
     // For now, simple delete. (Enhancement: Restore stock if invoice was confirmed)
     // BUT, converting a Quote to Invoice consumes stock. Deleting an invoice doesn't automatically restock in this current implementation unless added.
     
     await pool.query('DELETE FROM invoices WHERE id = $1', [id]);
     res.json('Deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
