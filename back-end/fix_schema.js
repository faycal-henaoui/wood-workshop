const pool = require('./db');

const fixDatabase = async () => {
  console.log('🏗️ checking database schema for missing columns...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add length/width to MATERIALS
    await client.query(`
      ALTER TABLE materials 
      ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) DEFAULT 0;
    `);
    console.log('✅ Added length/width to materials');

    // 2. Add length/width to SCRAP_MATERIALS (if missing)
    await client.query(`
      ALTER TABLE scrap_materials 
      ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) DEFAULT 0;
    `);
    console.log('✅ Added length/width to scrap_materials');

    await client.query('COMMIT');
    console.log('🚀 Database schema updated successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database update failed:', err.message);
  } finally {
    client.release();
  }
};

module.exports = fixDatabase;
