const router = require('express').Router();
const pool = require('../db');

/**
 * Get All Materials
 * Fetches the list of all raw materials from the database.
 * Ordered alphabetically by name.
 */
router.get('/', async (req, res) => {
  try {
    const allMaterials = await pool.query('SELECT * FROM materials ORDER BY name ASC');
    res.json(allMaterials.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Add New Material
 * Creates a new raw material record.
 * Accepts: name, type, quantity, unit, price, thresholds.
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, quantity, unit, price, low_stock_threshold } = req.body;
    const newMaterial = await pool.query(
      'INSERT INTO materials (name, type, quantity, unit, price, low_stock_threshold) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, type, quantity, unit, price, low_stock_threshold]
    );
    res.json(newMaterial.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, detailed: err.stack });
  }
});

/**
 * Delete Material
 * Removes a material from the database by ID.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json('Material was deleted!');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Update Material
 * Updates details of an existing material.
 * Used for correcting stock levels manually or changing prices.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, quantity, unit, price, low_stock_threshold } = req.body;
    
    const updateMaterial = await pool.query(
      'UPDATE materials SET name = $1, type = $2, quantity = $3, unit = $4, price = $5, low_stock_threshold = $6 WHERE id = $7 RETURNING *',
      [name, type, quantity, unit, price, low_stock_threshold, id]
    );

    if (updateMaterial.rows.length === 0) {
      return res.status(404).json('Material not found');
    }

    res.json(updateMaterial.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, detailed: err.stack });
  }
});

module.exports = router;
