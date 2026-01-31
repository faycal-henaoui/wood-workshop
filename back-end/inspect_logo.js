const pool = require('./db');
const fs = require('fs');

(async () => {
  try {
    const res = await pool.query('SELECT logo FROM settings LIMIT 1');
    const logo = res.rows[0]?.logo;
    
    if (!logo) {
      console.log("No logo found.");
    } else {
      console.log("Logo starts with:", logo.substring(0, 50));
      // Save it to a file for closer inspection if it's text-based (SVG)
      // If it's base64, we can see the mime type.
      fs.writeFileSync('logo_dump.txt', logo);
      console.log("Logo saved to logo_dump.txt");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
