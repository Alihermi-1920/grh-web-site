//middleware/auth.js
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Special case for admin token (from localStorage)
  if (authHeader && authHeader.includes("admin-token-")) {
    req.user = { role: "admin" };
    return next();
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token manquant ou mal formaté"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({
      success: false,
      message: "Token invalide"
    });
  }
};

module.exports = auth;
