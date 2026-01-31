const router = require('express').Router();
const pool = require('../db');

/**
 * Get Scrap Materials
 * Fetches all available scrap pieces.
 * Joins with the `materials` table to get the correct name/type.
 */
router.get('/', async (req, res) => {
  try {
    const scrap = await pool.query(
      'SELECT s.*, m.name FROM scrap_materials s JOIN materials m ON s.material_id = m.id'
    );
    res.json(scrap.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Delete Scrap Material
 * Removes a scrap entry (e.g., if used or thrown away).
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM scrap_materials WHERE id = $1', [id]);
    res.json('Scrap material deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
