const mysql = require("mysql2");
const { promisify } = require("util");
const logger = require("../utils/logger");

// Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Database configuration
const config = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create a connection pool
const db = mysql.createPool(config);

// Promisify the query method
db.query = promisify(db.query).bind(db);

// Function to check the database connection
const checkDbConnection = async () => {
  db.getConnection((error, connection) => {
    if (error) {
      console.log(
        `Failed to connect to the database: ${error.message}\t${req.method}\t${req.url}\t${req.headers.origin}`
      );
      logger.error(
        `Failed to connect to the database:, ${error.message}\t${req.method}\t${req.url}\t${req.headers.origin}`
      );
      return;
    }
    if (connection) connection.release();
    console.log("Database connection established");
    logger.debug("Database connection established");
  });
};

module.exports = { db, checkDbConnection };
