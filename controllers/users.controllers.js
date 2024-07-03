const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { db } = require("../Database/database");
const { promisify } = require("util");
const logger = require("../utils/logger");
const { upload } = require("../middleware/multer.middleware");
const query = promisify(db.query).bind(db);

// Get user details function
exports.getUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.user;
    const selectQuery = `SELECT userId, firstName, lastName, username, email, phoneNumber, role, referralCode, avatar, totalBalance FROM users WHERE userId = ?`;

    // Execute the query to get user details
    const user = await query(selectQuery, [userId]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user details if found
    res.status(200).json({
      success: true,
      user: user[0],
    });
  } catch (error) {
    logger.error(`Error fetching user details: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user details function --Admin
exports.getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const selectQuery = `SELECT userId, firstName, lastName, username, email, phoneNumber, role, referralCode, avatar, isActive, totalBalance FROM users WHERE userId = ?`;

    // Execute the query to get user details
    const userDetails = await query(selectQuery, [userId]);

    if (userDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user details if found
    res.status(200).json({
      success: true,
      userDetails: userDetails[0],
    });
  } catch (error) {
    logger.error(`Error fetching user details: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update user account
exports.updateAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = req.user;

    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      avatar,
      username,
      password,
    } = req.body;

    // Validate input data for non-admin users
    if (user.role !== "Admin") {
      if (
        !firstName ||
        !lastName ||
        !email ||
        !phoneNumber ||
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Fetch the existing user details
      const userResult = await query(
        `SELECT password FROM users WHERE userId = ?`,
        [userId]
      );

      // Check if user exists
      if (userResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const storedPassword = userResult[0].password;

      // Check if the provided password matches the stored password
      const isMatch = await bcrypt.compare(password, storedPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect password",
        });
      }
    }

    // Construct the update query
    const updateQuery = `
      UPDATE users
      SET firstName = ?, lastName = ?, email = ?, phoneNumber = ?, avatar = ?, username = ?
      WHERE userId = ?
    `;

    // Execute the update query
    const result = await query(updateQuery, [
      firstName,
      lastName,
      email,
      phoneNumber,
      avatar,
      username,
      userId,
    ]);

    // Check if the user was updated
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Account updated successfully",
    });
  } catch (error) {
    console.error("Error updating user account:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update Account Role
exports.updateAccountRole = asyncHandler(async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = req.user;

    // Check if the logged-in user has the 'Admin' role
    if (user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update user roles",
      });
    }

    // Validate the new role
    const validRoles = ["user", "Admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Update the user's role in the database
    const updateQuery = `
      UPDATE users
      SET role = ?
      WHERE userId = ?
    `;
    const result = await query(updateQuery, [role, userId]);

    // Check if the user was updated
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      updatedRole: true,
    });
  } catch (error) {
    console.error("Error updating user account role:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { userId } = req.params;

  // Validate input
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide userId, old password, and new password.",
    });
  }

  try {
    // Check if the user exists
    const userQuery = "SELECT * FROM users WHERE userId = ?";
    const userResult = await query(userQuery, [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult[0];

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash the new password
    const hashPassword = bcrypt.hashSync(newPassword, 10);

    // Update the password in the database
    const updatePasswordQuery =
      "UPDATE users SET password = ? WHERE userId = ?";
    const updateResult = await query(updatePasswordQuery, [
      hashPassword,
      userId,
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to update password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error(`Error changing password: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing the password",
    });
  }
});

// Update avatar image handler
exports.updateAvatar = asyncHandler(async (req, res) => {
  // Handle file upload with multer middleware
  upload.single("avatar")(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      // Multer error occurred (e.g., file size limit exceeded)
      logger.error(`File upload error: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: "File upload error: " + error.message,
      });
    } else if (error) {
      // Other unexpected errors
      logger.error(`File upload error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "File upload error: " + error.message,
      });
    }

    // Ensure the file was uploaded correctly
    if (!req.file) {
      logger.error("No file uploaded");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // File upload successful, now update user avatar path in the database
    const userId = req.params.userId;
    const protocol = req.protocol;
    const host = req.get("host");
    const imageUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`;

    logger.info(`Uploading file for userId: ${userId}, imageUrl: ${imageUrl}`);

    try {
      // Fetch the existing avatar path
      const existingUser = await query(
        `SELECT avatar FROM users WHERE userId = ?`,
        [userId]
      );
      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`,
        });
      }

      const existingAvatar = existingUser[0].avatar;
      logger.info(`Existing avatar path: ${existingAvatar}`);

      // Delete the old avatar file if it exists
      if (existingAvatar) {
        const oldAvatarPath = path.join(
          __dirname,
          "..",
          existingAvatar.replace(`${protocol}://${host}/`, "")
        );
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          logger.info(`Deleted old avatar: ${oldAvatarPath}`);
        } else {
          logger.info(`Old avatar file not found: ${oldAvatarPath}`);
        }
      }

      // Update the avatar path in the database
      const updateUserQuery = `
        UPDATE users
        SET avatar = ?
        WHERE userId = ?
      `;
      const result = await query(updateUserQuery, [imageUrl, userId]);

      logger.info(`Database update result: ${JSON.stringify(result)}`);

      if (result.affectedRows > 0) {
        // Avatar update successful
        logger.info(`Avatar updated successfully for user ID: ${userId}`);
        return res.status(200).json({
          success: true,
          message: "Avatar updated successfully",
          avatar: imageUrl,
        });
      } else {
        // No user found with the provided userId
        logger.error(`User with ID ${userId} not found`);
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`,
        });
      }
    } catch (error) {
      // Database error
      logger.error(`Database error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Database error: " + error.message,
      });
    }
  });
});

// Admin controllers
// Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
  try {
    const selectQuery = `SELECT userId, firstName, lastName, username, email, phoneNumber, role, referralCode, avatar, isActive, totalBalance FROM users ORDER BY createdAt DESC`;

    // Execute the query to get all user details
    const userResult = await db.query(selectQuery);

    // The result set is in the userResult array
    const users = userResult;

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Users not found",
      });
    }

    // Return user details if found
    res.status(200).json({
      success: true,
      users, // return users array
    });
  } catch (error) {
    // Handle any errors that occur during the database query
    return res.status(500).json({
      success: false,
      message: error.stack,
    });
  }
});

// Get single user
exports.getSingleUsers = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const selectQuery = `SELECT userId, firstName, lastName, username, email, phoneNumber, role, referralCode, avatar, status, totalBalance FROM users WHERE userId = ?`;

    // console.log(userId);
    // Execute the query to get user details
    const userResult = await db.query(selectQuery, [userId]);

    // The result set is to the userResult array
    const users = userResult;

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user details if found
    res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    // Handle any errors that occur during the database query
    return res.status(500).json({
      success: false,
      message: error.stack,
    });
  }
});

// Deactivate or activate a user account
exports.changeUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Start a transaction
    await query("START TRANSACTION");

    // Check if the user exists and get the current activation status
    const userQuery = "SELECT isActive FROM users WHERE userId = ?";
    const userResult = await query(userQuery, [userId]);

    if (userResult.length === 0) {
      await query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle the activation status
    const currentStatus = userResult[0].isActive;
    const newStatus = !currentStatus;

    const updateUserQuery = "UPDATE users SET isActive = ? WHERE userId = ?";
    const updateResult = await query(updateUserQuery, [newStatus, userId]);

    if (updateResult.affectedRows === 0) {
      await query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Failed to update user status",
      });
    }
    // console.log(updateResult)
    // Commit the transaction
    await query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `User account has been ${
        newStatus ? "activated" : "deactivated"
      }`,
      accountStatus: newStatus,
    });
  } catch (error) {
    // Rollback the transaction in case of any error
    await query("ROLLBACK");
    logger.error(`Error deactivating/activating user: ${error.message}`);
    console.error(`Error deactivating/activating user: ${error.stack}`);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the user status",
    });
  }
});

// delete user account
exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the user exists and fetch associated files
    const userQuery = `
      SELECT u.*, q.imagePath AS qrCodeImagePath, u.avatar AS avatarPath
      FROM users u
      LEFT JOIN qrCodeImage q ON u.userId = q.userId
      WHERE u.userId = ?
    `;
    const userResult = await query(userQuery, [userId]);

    if (userResult.length === 0) {
      logger.error(`User with ID ${userId} not found.`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult[0];
    logger.info(`User ${userId} found. Preparing to delete associated files.`);

    // Function to delete a file
    const deleteFile = (filePath) => {
      return new Promise((resolve, reject) => {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error(`Failed to delete file ${filePath}: ${err.message}`);
              reject(err);
            } else {
              logger.info(`Successfully deleted file ${filePath}`);
              resolve();
            }
          });
        } else {
          logger.info(`File ${filePath} does not exist.`);
          resolve(); // Resolve if file does not exist
        }
      });
    };

    // Delete QR code image if it exists
    if (user.qrCodeImagePath) {
      const qrCodeImagePath = path.resolve(
        __dirname,
        "..",
        "uploads",
        "qrcodes",
        path.basename(user.qrCodeImagePath)
      );
      await deleteFile(qrCodeImagePath);
    }

    // Delete avatar image if it exists
    if (user.avatarPath) {
      const avatarPath = path.resolve(
        __dirname,
        "..",
        "uploads",
        "images",
        path.basename(user.avatarPath)
      );
      await deleteFile(avatarPath);
    }

    // Start a transaction
    await query("START TRANSACTION");
    logger.info(`Transaction started for deleting user ${userId}.`);

    // Delete associated referral records
    const deleteReferralsQuery =
      "DELETE FROM referrals WHERE referredId = ? OR referrerId = ?";
    await query(deleteReferralsQuery, [userId, userId]);
    logger.info(`Deleted referrals for user ${userId}.`);

    // Delete associated QR code image record
    const deleteQrCodeQuery = "DELETE FROM qrCodeImage WHERE userId = ?";
    await query(deleteQrCodeQuery, [userId]);
    logger.info(`Deleted QR code image record for user ${userId}.`);

    // Delete the user account
    const deleteUserQuery = "DELETE FROM users WHERE userId = ?";
    const deleteResult = await query(deleteUserQuery, [userId]);

    if (deleteResult.affectedRows === 0) {
      await query("ROLLBACK");
      logger.error(
        `Failed to delete user ${userId}. Rolling back transaction.`
      );
      return res.status(400).json({
        success: false,
        message: "Failed to delete user",
      });
    }

    // Commit the transaction
    await query("COMMIT");
    logger.info(`Transaction committed. User ${userId} deleted successfully.`);

    return res.status(200).json({
      success: true,
      message: "User account has been deleted successfully",
      deletedUser: true,
    });
  } catch (error) {
    // Rollback the transaction in case of any error
    await query("ROLLBACK");
    logger.error(`Error deleting user ${userId}: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user account",
    });
  }
});

// exports.createUser = asyncHandler(async (req, res) => {});
