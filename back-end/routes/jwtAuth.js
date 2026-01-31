const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");
require("dotenv").config();

/**
 * Register Route
 * Creates a new user (admin) in the database.
 * 1. Checks if user already exists.
 * 2. Hashes the password using bcrypt.
 * 3. Inserts user into DB.
 * 4. Generates and returns a JWT token.
 */
router.post("/register", validInfo, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username
    ]);

    if (user.rows.length > 0) {
      return res.status(401).send("User already exists");
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, 'admin') RETURNING *",
      [username, bcryptPassword]
    );

    const token = jwt.sign(
      { user: newUser.rows[0].id },
      process.env.jwtSecret || "secretKey123",
      { expiresIn: "24h" }
    );

    res.json({ token, user: { username: newUser.rows[0].username, role: newUser.rows[0].role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Login Route
/**
 * Login Route
 * Authenticates a user.
 * 1. Checks if user exists.
 * 2. Compares the provided password with the stored hashed password.
 * 3. Generates and returns a JWT token if successful.
 */
router.post("/login", validInfo, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Password or Email is incorrect");
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(401).json("Password or Email is incorrect");
    }

    const token = jwt.sign(
      { user: user.rows[0].id },
      process.env.jwtSecret || "secretKey123",
      { expiresIn: "24h" }
    );

    res.json({ token, user: { username: user.rows[0].username, role: user.rows[0].role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Verify Token Route
/**
 * Verification Route
 * Checks if the user's token is still valid.
 * Used by the frontend on page load to persist the session.
 */
router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
