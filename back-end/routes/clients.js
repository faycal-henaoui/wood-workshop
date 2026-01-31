const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET all clients
 * Returns a list of all clients, ordered by creation date (newest first).
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * POST a new client
 * Creates a new client record.
 * Accepts: name, phone, email, address.
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const newClient = await pool.query(
      'INSERT INTO clients (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, email, address]
    );
    res.json(newClient.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * DELETE a client
 * Removes a client from the database.
 * Note: This might be blocked by Foreign Key constraints if the client has invoices.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json('Client was deleted!');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * PUT update a client
 * Updates an existing client's contact information.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    const updateClient = await pool.query(
      'UPDATE clients SET name = $1, phone = $2, email = $3, address = $4 WHERE id = $5 RETURNING *',
      [name, phone, email, address, id]
    );
    res.json(updateClient.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * GET client history
 * Fetches all invoices related to a specific client.
 * Used for the "History" tab in the Clients page.
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
