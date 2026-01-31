const router = require('express').Router();
const pool = require('../db');

/**
 * GET Settings
 * Retrieves shop configuration (Name, Logo, Theme, Currency).
 * Returns default values if no settings record exists.
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({
        shop_name: '',
        shop_address: '',
        shop_phone: '',
        tax_rate: 0,
        currency: 'DZD',
        logo: '',
        theme: 'dark'
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * PUT Settings
 * Updates or Creates the single settings record.
 */
router.put('/', async (req, res) => {
  try {
    const { shop_name, shop_address, shop_phone, tax_rate, currency, logo, theme } = req.body;
    console.log(`Saving Settings - Shop: ${shop_name}, Logo Length: ${logo ? logo.length : 0}`);
    
    // Check if settings exist
    const check = await pool.query('SELECT * FROM settings LIMIT 1');
    
    let result;
    if (check.rows.length === 0) {
      // Insert
      result = await pool.query(
        'INSERT INTO settings (shop_name, shop_address, shop_phone, tax_rate, currency, logo, theme) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [shop_name, shop_address, shop_phone, tax_rate, currency, logo, theme]
      );
    } else {
      // Update
      const id = check.rows[0].id;
      result = await pool.query(
        'UPDATE settings SET shop_name = $1, shop_address = $2, shop_phone = $3, tax_rate = $4, currency = $5, logo = $6, theme = $7 WHERE id = $8 RETURNING *',
        [shop_name, shop_address, shop_phone, tax_rate, currency, logo, theme, id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '42703') { // Undefined column
       console.error("Missing columns in settings table. Please run migration.");
       res.status(500).send("Database Error: Missing logo or theme column");
    } else {
       console.error(err.message);
       res.status(500).send('Server Error');
    }
  }
});

/**
 * GET Material Types
 * Fetches configured raw material categories (e.g., 'Sheet', 'Profile', 'Liquid').
 */
router.get('/types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM material_types ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * POST Add Material Type
 * Adds a new category option for materials.
 */
router.post('/types', async (req, res) => {
  try {
    const { name, unit } = req.body;
    const result = await pool.query(
      'INSERT INTO material_types (name, unit) VALUES ($1, $2) RETURNING *',
      [name, unit]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE Material Type
router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM material_types WHERE id = $1', [id]);
    res.json('Material type deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
