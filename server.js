const app = require(`./app`);
const { checkDbConnection } = require("./Database/database");
const {
  deleteUnverifiedUser,
} = require("./middleware/actionScheduler.middleware");

const logger = require("./utils/logger");

// Handle Uncaught Exception
process.on(`uncaughtException`, (error) => {
  console.log(`ERROR: ${error.message}`);
  console.log(`shutting down the server for handling uncaught exception`);

  logger.error(`ERROR: ${error.message}`);
  logger.error(`shutting down the server for handling uncaught exception`);
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

const port = process.env.PORT;

// deleting unverified User
deleteUnverifiedUser.start();
// deleteResetTokenAndExpiryTime.start();

// create server
const server = app.listen(port, () => {
  logger.debug(`server is running on http://localhost:${port}`);

  console.log(`server is running on http://localhost:${port}`);

  // Check the database connection
  checkDbConnection();
});

// unhandled promise rejection
process.on(`unhandledRejection`, (error) => {
  console.log(`shutting down the server for ${error.stack}`);
  console.log(`shutting down the server for unhandled promise rejection`);

  logger.error(`shutting down the server for ${error.message}`);
  logger.error(`shutting down the server for unhandled promise rejection`);

  // then close the server
  server.close(() => {
    process.exit(1);
  });
});
