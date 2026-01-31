const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT id, logo FROM settings LIMIT 1');
    if (res.rows.length === 0 || !res.rows[0].logo) {
      console.log('No logo found.');
      process.exit(0);
    }

    let logo = res.rows[0].logo;
    const prefix = 'data:image/svg+xml;base64,';

    if (!logo.startsWith(prefix)) {
      console.log('Logo is not a base64 SVG.');
      // It might be raw SVG or PNG. 
      // If it's raw SVG (starts with <svg), we can edit directly.
      if (logo.includes('<svg') && logo.includes('fill="#FFFFFF"')) {
         console.log('Detected raw SVG with white background.');
         const newLogo = logo.replace(/<rect[^>]*fill="#FFFFFF"[^>]*\/>/i, '');
         await pool.query('UPDATE settings SET logo = $1 WHERE id = $2', [newLogo, res.rows[0].id]);
         console.log('Fixed raw SVG.');
      }
      process.exit(0);
    }

    // Is Base64 SVG
    const base64Content = logo.slice(prefix.length);
    const decoded = Buffer.from(base64Content, 'base64').toString('utf8');

    console.log('Decoded start:', decoded.substring(0, 100));
    require('fs').writeFileSync('decoded_logo.svg', decoded);
    console.log('Saved decoded SVG to decoded_logo.svg');

    // Analyze colors
    const fillRegex = /fill="#([0-9A-Fa-f]{6})"/g;
    let match;
    const colors = new Set();
    while ((match = fillRegex.exec(decoded)) !== null) {
        colors.add(match[1].toUpperCase());
    }
    console.log('Colors found in SVG:', Array.from(colors).sort());

    // Check for potential background colors (near white)
    // We previously removed EEEEEEE. let's see what else is there.
    // Potential candidates seen before: FAFAF8, ECEBEB, EDEDEC, EDEDED, F5F5F4, E4E4E4
    
    // We will attempt to remove these specific off-white colors if confirmed
    const backgroundColors = ['FAFAF8', 'ECEBEB', 'EDEDEC', 'EDEDED', 'F5F5F4', 'E4E4E4', 'FFFFFF', 'EEEEEE'];
    let newDecoded = decoded;
    let replaced = false;

    backgroundColors.forEach(color => {
        const regex = new RegExp(`<path[^>]*fill="#${color}"[^>]*\\/>`, 'gi');
        if (regex.test(newDecoded)) {
             console.log(`Removing paths with fill #${color}`);
             newDecoded = newDecoded.replace(regex, '');
             replaced = true;
        }
    });

    if (replaced) {
        const newBase64 = Buffer.from(newDecoded).toString('base64');
        const newLogo = prefix + newBase64;
        await pool.query('UPDATE settings SET logo = $1 WHERE id = $2', [newLogo, res.rows[0].id]);
        console.log('Updated logo removing additional background layers.');
    } else {
        console.log('No additional background layers found to remove.');
    }


    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
