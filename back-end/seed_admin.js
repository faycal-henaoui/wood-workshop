/**
 * Admin Seeder Script
 * Checks for existence of 'admin' user.
 * If missing, creates one with default credentials (admin/admin123).
 * Run manually typically: `node seed_admin.js`
 */
const pool = require('./db');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
    try {
        console.log("Checking for admin user...");
        const userCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        
        if (userCheck.rows.length === 0) {
            console.log("Creating default admin user...");
            const saltRound = 10;
            const salt = await bcrypt.genSalt(saltRound);
            const bcryptPassword = await bcrypt.hash("admin123", salt);

            await pool.query(
                "INSERT INTO users (username, password, role) VALUES ($1, $2, 'admin')",
                ['admin', bcryptPassword]
            );
            console.log("Admin user created (username: admin, password: admin123)");
        } else {
            console.log("Admin user already exists.");
        }
    } catch (err) {
        console.error("Error seeding admin:", err.message);
    } finally {
        // We aren't closing the pool here because this might be run inside another script, 
        // strictly speaking for a standalone script we should, but process.exit handles it.
        process.exit(0);
    }
};

seedAdmin();
