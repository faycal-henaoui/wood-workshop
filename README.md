# Woodworking Shop Management System

A full-stack web application designed for small manufacturing businesses (like carpentry or joinery workshops) to manage inventory, production, sales, and financial reporting.

![Dashboard Preview](docs/dashboard-preview.png)

## 🚀 Features

### 🏭 Production & Inventory
- **Raw Material Tracking**: Manage stock of sheets, profiles, and hardware.
- **Smart Cutting Logic**: Automatically calculates sheet usage and remaining scrap when creating dimension-based invoices.
- **Scrap Management**: Track reusable off-cuts to minimize waste.
- **Product Recipes**: Define complex products (e.g., "Kitchen Cabinet") with a bill of materials (BOM) for auto-pricing.

### 💰 Sales & Invoicing
- **Invoice & Quote Builder**: Create professional breakdown invoices or estimates.
- **PDF Generation**: One-click download of printable Invoices and Purchase Orders.
- **Stock Integration**: Converting a "Quote" to an "Invoice" automatically deducts materials from inventory.

### 📊 Financial Analytics
- **Dashboard**: Real-time overview of current stock value, monthly revenue, and active orders.
- **Reports**: Visual analytics (Charts/Graphs) for revenue vs. profit, top-selling items, and client value.
- **Accounts Receivable**: Track paid vs. pending invoices.

## 🛠 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Styled-Components (CSS-in-JS) with Dark/Light mode support.
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL installed and running

### 1. Database Setup
Create a new PostgreSQL database and import the schema.
```bash
# In psql or pgAdmin
CREATE DATABASE woodshop;
# Run the content of back-end/schema.sql
```

### 2. Backend Setup
```bash
cd back-end
npm install

# Configure Database
# Edit back-end/db.js or set environment variables for user/password/host

# Run the server
node index.js
```
The server runs on port `5000` by default.

### 3. Frontend Setup
```bash
cd front-end
npm install

# Run development server
npm run dev
```

## 🔑 Default Login
The system comes with a seeder for an admin user.
- **Username**: `admin`
- **Password**: `admin123`

To generate this user manually, run:
```bash
node back-end/seed_admin.js
```

## 📸 Screenshots

| Dashboard | Invoice Maker |
|-----------|---------------|
| Shows high-level stats | Complex calculation engine |

## 📄 License
This project is open-source and available under the MIT License.
