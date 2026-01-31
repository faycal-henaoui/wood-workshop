const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT id, shop_name, length(logo) as logo_length, substr(logo, 1, 30) as logo_preview FROM settings');
    console.log('Settings Rows:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
