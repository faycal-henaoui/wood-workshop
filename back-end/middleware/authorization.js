const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Authorization Middleware
 * Verifies the JWT token sent in the "token" header.
 * If valid, it attaches the user payload to req.user and allows the request to proceed.
 * If invalid or missing, it returns a 403 Not Authorized error.
 */
module.exports = async (req, res, next) => {
  try {
    // 1. Get token from header
    const jwtToken = req.header("token");

    if (!jwtToken) {
      return res.status(403).json("Not Authorized");
    }

    // 2. Verify token
    const payload = jwt.verify(jwtToken, process.env.jwtSecret || "secretKey123");

    req.user = payload.user;
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(403).json("Not Authorized");
  }
};
