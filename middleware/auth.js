const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  // Get JWT from header
  const token = req.header("x-auth-token");

  // If no JWT...
  if (!token) {
    return res.status(401).json({ msg: "No token - access denied" });
  }

  // Else, verify JWT
  try {
    // Decode JWT against jwtSecret (default.json)
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    // Set user to the decoded user
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
