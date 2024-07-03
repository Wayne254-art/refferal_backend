const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { db } = require("../Database/database");
const { promisify } = require("util");
const query = promisify(db.query).bind(db);

const isAuthenticated = async (req, res, next) => {
  // const { access_token } = req.cookies;
  const access_token = req.header("Authorization")?.replace("Bearer ", "");
  // console.log(req.headers);
  // console.log(req.cookies);

  console.log(access_token);

  if (!access_token) {
    return res.status(401).json("No token provided");
  }

  try {
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET_KEY);

    // check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({
        success: false,
        message: "Token has expired Please Login again",
      });
    }

    const userQuery = "SELECT userId, role FROM users WHERE userId = ?";
    const userResult = await query(userQuery, [decoded.userId]);

    if (userResult.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = { userId: decoded.userId, role: userResult[0].role };
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(401).json({ message: "Invalid token" });
  }

  // const token = req.header("Authorization")?.replace("Bearer ", "");
  // console.log(token);

  // if (!token) {
  //   return res.status(401).json({ message: "No token provided" });
  // }

  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  //   const userQuery = "SELECT userId, role FROM users WHERE userId = ?";
  //   const userResult = await query(userQuery, [decoded.userId]);

  //   if (userResult.length === 0) {
  //     return res.status(401).json({ message: "Invalid token" });
  //   }

  //   req.user = { userId: decoded.userId, role: userResult[0].role };
  //   // req.user = userResult[0];
  //   next();
  // } catch (error) {
  //   logger.error(`Authentication error: ${error.message}`);
  //   res.status(401).json({ message: "Invalid token" });
  // }

  // const token = req.headers["authorization"]?.split(" ")[1];
  // if (!token) return res.status(401).send("Access denied");

  // jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
  //   if (err) return res.status(403).send("Invalid token");
  //   req.user = user;
  //   next();
  // });
};

// Checking roles
// Admin auth
const isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(req.user);
      return res.status(500).json({
        message: `Operation not permitted to ${req.user.role} ..Access denied`,
      });
    }
    next();
  };
};

module.exports = { isAuthenticated, isAdmin };
