const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config();
const fixDatabase = require('./fix_schema'); // Import the fix script

const app = express();
const PORT = process.env.PORT || 5000;

// Run DB fix on startup
fixDatabase();

/**
 * Middleware Setup
 * - cors: Enables Cross-Origin Resource Sharing (allows frontend to talk to backend)
 * - express.json: Parses incoming JSON requests (up to 50mb)
 * - express.urlencoded: Parses URL-encoded data
 */
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * API Route Declarations
 * Maps endpoint paths to their respective router files
 */
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/products', require('./routes/products'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/report-export', require('./routes/report_export'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/scrap', require('./routes/scrap'));
app.use('/api/users', require('./routes/users'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/auth', require('./routes/jwtAuth'));

// Serve Static Assets in Production
if (process.env.NODE_ENV === 'production') {
  // Serve the 'dist' folder from the front-end build
  app.use(express.static(path.join(__dirname, '../front-end/dist')));

  // Handle Client-side routing: return index.html for any unknown route
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
