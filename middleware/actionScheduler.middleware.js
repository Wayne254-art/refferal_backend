const cron = require("node-cron");
const { db } = require("../Database/database");
const logger = require("../utils/logger");
const { promisify } = require("util");
const query = promisify(db.query).bind(db);

// Schedule task to run every minute
const deleteUnverifiedUser = cron.schedule("* * * * *", async () => {
  try {
    const deleteQuery = `
      DELETE FROM users
      WHERE isVerified = 'false'
      AND lastVerified < (NOW() - INTERVAL 10 MINUTE)
    `;

    // Execute the delete query
    const result = await query(deleteQuery);

    if (result.affectedRows > 0) {
      console.log(`Deleted ${result.affectedRows} unVerified users.`);
      logger.info(`Deleted ${result.affectedRows} unVerified users.`);
    }
  } catch (error) {
    console.error("Error deleting unVerified users:", error.message);
    logger.error(`Error deleting unVerified users: ${error.message}`);
  }
});

//
// const deleteResetTokenAndExpiryTime = cron.schedule("* * * * *", async () => {
//   try {
//     const updateQuery = `
//       UPDATE users
//       SET resetToken = NULL, resetTokenExpiry = NULL
//       WHERE resetTokenExpiry < (NOW() - INTERVAL 1 MINUTE)
//     `;

//     // Execute the update query
//     const result = await query(updateQuery);

//     if (result.affectedRows > 0) {
//       console.log(
//         `Deleted reset tokens and expiry times for ${result.affectedRows} users.`
//       );
//       logger.info(
//         `Deleted reset tokens and expiry times for ${result.affectedRows} users.`
//       );
//     }
//   } catch (error) {
//     console.error(
//       "Error deleting reset tokens and expiry times:",
//       error.message
//     );
//     logger.error(
//       `Error deleting reset tokens and expiry times: ${error.message}`
//     );
//   }
// });

module.exports = { deleteUnverifiedUser };
