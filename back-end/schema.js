// Combined Database Setup & Migration Script
// This file replaces: schema.sql, seed.sql, and all 8 'add_*.js' scripts.
// It represents the "Master State" of your database.

const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Use same logic as db.js
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

const sql = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS product_materials CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS scrap_materials CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS material_types CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material Types
CREATE TABLE material_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    unit VARCHAR(50) NOT NULL
);

-- Materials Table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scrap Materials
CREATE TABLE scrap_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    dimensions VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(10, 2) NOT NULL,
    labor_cost DECIMAL(10, 2) DEFAULT 0.00,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Materials
CREATE TABLE product_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10, 2) NOT NULL,
    cut_length DECIMAL(10, 2) DEFAULT 0,
    cut_width DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    invoice_number SERIAL,
    total_amount DECIMAL(10, 2) NOT NULL,
    labor_cost DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Pending',
    type VARCHAR(20) DEFAULT 'invoice',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items Table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    material_id UUID REFERENCES materials(id),
    width NUMERIC,
    height NUMERIC,
    is_scrap BOOLEAN DEFAULT FALSE
);

-- Settings Table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    shop_name VARCHAR(255),
    shop_address TEXT,
    shop_phone VARCHAR(50),
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'DZD',
    logo TEXT,
    theme VARCHAR(10) DEFAULT 'dark'
);

-- Purchases Table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(255),
    total_amount DECIMAL(10, 2),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Items Table
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- SEED DATA

INSERT INTO material_types (name, unit) VALUES 
('Sheet', 'sheet'),
('Hardware', 'pcs'),
('Paint', 'liter'),
('Wood', 'piece') 
ON CONFLICT (name) DO NOTHING;

INSERT INTO product_categories (name) VALUES 
('Kitchen'), ('Office'), ('Living Room'), ('Bedroom')
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (shop_name, shop_address, shop_phone, tax_rate, currency, theme)
VALUES ('Salim Woodworks', '123 Industrial Zone, Algiers', '0555-123-456', 19.00, 'DZD', 'dark');

-- (Users are created by seed_admin.js for proper hashing)
`;

async function runSchema() {
    try {
        console.log("Applying master schema...");
        await pool.query(sql);
        console.log("Schema applied successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Schema failed:", err.message);
        process.exit(1);
    }
}

runSchema();
