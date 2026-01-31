const router = require('express').Router();
const pool = require('../db');

/**
 * Get All Products
 * Fetches all manufactured products.
 * Includes a count of how many raw materials make up each product.
 */
router.get('/', async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, 
      (SELECT COUNT(*) FROM product_materials pm WHERE pm.product_id = p.id) as material_count 
      FROM products p 
      ORDER BY p.name ASC
    `);
    res.json(products.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Category Routes ---

/**
 * Get All Categories
 * Fetches list of product categories (e.g., 'Couch', 'Table').
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await pool.query('SELECT * FROM product_categories ORDER BY name ASC');
    res.json(categories.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Create Category
 * Adds a new product category to the system.
 */
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = await pool.query(
      'INSERT INTO product_categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedCategory = await pool.query(
      'UPDATE product_categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (updatedCategory.rows.length === 0) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.json(updatedCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if used? Maybe later. For now just delete.
    await pool.query('DELETE FROM product_categories WHERE id = $1', [id]);
    res.json({ msg: 'Category deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- End Category Routes ---

// Get Single Product with its Materials
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (product.rows.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const materials = await pool.query(
      `SELECT pm.*, m.name, m.unit, m.price 
       FROM product_materials pm 
       JOIN materials m ON pm.material_id = m.id 
       WHERE pm.product_id = $1`,
      [id]
    );

    res.json({ ...product.rows[0], materials: materials.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create New Product
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, description, category, base_price, labor_cost, materials } = req.body;

    // 1. Create Product
    const newProduct = await client.query(
      'INSERT INTO products (name, description, category, base_price, labor_cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, category, base_price, labor_cost]
    );
    const productId = newProduct.rows[0].id;

    // 2. Add Materials (Recipe)
    if (materials && materials.length > 0) {
      for (const mat of materials) {
        await client.query(
          'INSERT INTO product_materials (product_id, material_id, quantity_required, cut_length, cut_width) VALUES ($1, $2, $3, $4, $5)',
          [productId, mat.material_id, mat.quantity_required, mat.cut_length || 0, mat.cut_width || 0]
        );
      }
    }

    await client.query('COMMIT');
    res.json(newProduct.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

// Update Product
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, description, category, base_price, labor_cost, materials } = req.body;

    // 1. Update Product Details
    const updatedProduct = await client.query(
      `UPDATE products 
       SET name = $1, description = $2, category = $3, base_price = $4, labor_cost = $5 
       WHERE id = $6 
       RETURNING *`,
      [name, description, category, base_price, labor_cost, id]
    );

    if (updatedProduct.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ msg: 'Product not found' });
    }

    // 2. Update Recipe (Delete all old materials, insert new ones)
    // First, delete existing
    await client.query('DELETE FROM product_materials WHERE product_id = $1', [id]);

    // Then, insert new list
    if (materials && materials.length > 0) {
      for (const mat of materials) {
        await client.query(
          'INSERT INTO product_materials (product_id, material_id, quantity_required, cut_length, cut_width) VALUES ($1, $2, $3, $4, $5)',
          [id, mat.material_id, mat.quantity_required, mat.cut_length || 0, mat.cut_width || 0]
        );
      }
    }

    await client.query('COMMIT');
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

// Delete Product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json('Product deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
