const { Pool } = require('pg');
require('dotenv').config();

/**
 * Database Connection Pool
 * Configures the connection to the PostgreSQL database.
 * Supports both local development variables and Heroku's DATABASE_URL.
 */

const isProduction = process.env.NODE_ENV === 'production';

console.log('DB Config:', {
  isProduction,
  connectionString: isProduction ? 'Using process.env.DATABASE_URL' : 'Using Local Vars'
});

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false
});

module.exports = pool;
