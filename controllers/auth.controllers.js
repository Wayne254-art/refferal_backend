const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { db } = require("../Database/database");
const { promisify } = require("util");
const logger = require("../utils/logger");
const sendMail = require("../utils/sendMail");
const {
  getFormattedTimestamp,
  generateUUID,
  generateRandomPassword,
  generateFromEmail,
  generateReferralCode,
} = require("../utils/helperFunctions");
const generateQRCode = require("../utils/qrCodeGenerator");

const query = promisify(db.query).bind(db);

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const COOKIE_EXPIRES_IN = process.env.COOKIE_EXPIRES_IN || 24 * 60 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const adminCode = process.env.ADMIN_REFFERAL_CODE;

// Create a new user record
exports.createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, referrerCode } = req.body;

  console.log(referrerCode);
  let { phoneNumber } = req.body;

  if (phoneNumber.startsWith("0")) {
    phoneNumber = "+254" + phoneNumber.slice(1);
  }

  try {
    const password = generateRandomPassword();
    const userId = generateUUID();
    const username = generateFromEmail(email);
    const hashPassword = bcrypt.hashSync(password, 10);
    const referralCode = generateReferralCode();
    const referralLink = `${FRONTEND_URL}/signup?referralCode=${referralCode}`;

    const checkQuery = `SELECT * FROM users WHERE email = ? OR phoneNumber = ?`;
    const insertUserQuery = `
      INSERT INTO users (userId, firstName, lastName, username, email, phoneNumber, password, referralCode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Check if the user already exists
    const existingUsers = await query(checkQuery, [email, phoneNumber]);

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User credentials already exist",
      });
    }

    // Start a transaction
    await query("START TRANSACTION");

    const newUser = [
      userId,
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      hashPassword,
      referralCode,
    ];

    const result = await query(insertUserQuery, newUser);

    if (result.affectedRows === 0) {
      await query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Failed to create user",
      });
    }

    // Determine the referrerId and referrer's referral code
    let referrerId;
    let referrerReferralCode;
    const adminReferralCode = adminCode;

    if (referrerCode) {
      const referrerQuery = `SELECT userId, referralCode FROM users WHERE referralCode = ?`;
      const referrerResult = await query(referrerQuery, [referrerCode]);
      if (referrerResult.length > 0) {
        referrerId = referrerResult[0].userId;
        referrerReferralCode = referrerResult[0].referralCode;
      } else {
        // If the provided referrerCode is invalid, set referrerCode to null
        referrerCode = null;
      }
    }
    console.log("refer", referrerCode);
    if (!referrerCode) {
      // If no valid referrerCode is provided, use the admin's referral code
      const adminReferrerQuery = `SELECT userId, referralCode FROM users WHERE referralCode = ?`;
      const adminReferrerResult = await query(adminReferrerQuery, [
        adminReferralCode,
      ]);
      if (adminReferrerResult.length > 0) {
        referrerId = adminReferrerResult[0].userId;
        referrerReferralCode = adminReferrerResult[0].referralCode;
      } else {
        await query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Invalid referrer code and admin referral code not found",
        });
      }
    }

    // Insert the referral record
    const referralId = generateUUID();
    const insertReferralQuery = `
      INSERT INTO referrals (referralId, referrerId, referredId, referralCode)
      VALUES (?, ?, ?, ?)
    `;

    const referralResult = await query(insertReferralQuery, [
      referralId,
      referrerId,
      userId,
      referrerReferralCode,
    ]);

    if (referralResult.affectedRows === 0) {
      await query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Failed to create referral record",
      });
    }

    // Generate the QR code and save it
    const qrCodeResult = await generateQRCode(referralCode);

    if (!qrCodeResult) {
      await query("ROLLBACK");
      return res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
      });
    }

    const { filePath, qrCodeId, imageUrl } = qrCodeResult;

    // Insert QR code image record
    const insertQrCodeQuery = `
      INSERT INTO qrCodeImage (qrCodeId, userId, imageUrl, imagePath)
      VALUES (?, ?, ?, ?)
    `;

    const qrCodeImageResult = await query(insertQrCodeQuery, [
      qrCodeId,
      userId,
      imageUrl,
      filePath,
    ]);

    if (qrCodeImageResult.affectedRows === 0) {
      await query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Failed to save QR code image",
      });
    }

    // Commit the transaction
    await query("COMMIT");

    // Generate the activation token
    const activationToken = jwt.sign(
      { userId, email, username, phoneNumber, referralLink, password },
      process.env.ACTIVATION_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Construct the activation URL
    const activationUrl = `${FRONTEND_URL}/activate/${activationToken}`;

    // Send activation email
    try {
      await sendMail({
        from: process.env.SMTP_MAIL,
        to: email,
        subject: "Account Activation",
        text: `Your Account has been created successfully.... Please activate your account by clicking the following link: ${activationUrl}`,
      });

      logger.info(`New user userId: ${userId} created as: ${username}`);
      return res.status(200).json({
        success: true,
        message:
          "Account created successfully. An activation email has been sent.",
        password,
      });
    } catch (error) {
      logger.error(`Error sending activation email: ${error.message}`);
      return res.status(500).json({
        success: false,
        message:
          "Account created but failed to send activation email. Please try again later.",
      });
    }
  } catch (error) {
    // Rollback the transaction in case of any error
    await query("ROLLBACK");
    logger.error(`${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Verify user
exports.verifyUser = asyncHandler(async (req, res) => {
  try {
    // Extract the token from the URL
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACTIVATION_SECRET);

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Check if the user is already verified
    const checkQuery = `SELECT isVerified FROM users WHERE userId = ? AND email = ?`;
    const user = await query(checkQuery, [decoded.userId, decoded.email]);

    if (user.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0].isVerified === "true") {
      return res.status(400).json({
        success: false,
        message: "User already verified. Please proceed to login.",
      });
    }

    // Update user record to mark as verified
    const updateQuery = `
      UPDATE users
      SET isVerified = 'true', lastVerified = NOW()
      WHERE userId = ? AND email = ?
    `;

    const result = await query(updateQuery, [decoded.userId, decoded.email]);

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found or already verified",
      });
    }

    // Send activation email
    try {
      await sendMail({
        from: process.env.SMTP_MAIL,
        to: decoded.email,
        subject: "Login Procedure",
        text: `Your account has been activated successfully. Please use this username: ${decoded.username} or email: ${decoded.email}, or phone number: ${decoded.phoneNumber} and password: ${decoded.password} to login to your account.  You can also use this link to referr a friend: ${decoded.referralLink}`,
      });
    } catch (error) {
      logger.error(`Error sending email: ${error.message}`);
      return res.status(500).json({
        success: false,
        message:
          "User verified but failed to send email. Please try logging in with the provided credentials.",
      });
    }

    logger.info(`User userId: ${decoded.userId} verified successfully`);
    return res.status(200).json({
      success: true,
      message:
        "User verified successfully. Check your email for login procedure.",
    });
  } catch (error) {
    logger.error(`${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// login user
exports.loginUser = asyncHandler(async (req, res) => {
  const { password } = req.body;

  let identifier = req.body.identifier;
  // console.log(req.body);

  // console.log(identifier);

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "all fields are required",
    });
  }

  if (identifier.startsWith("0")) {
    identifier = "+254" + identifier.slice(1);
  }

  try {
    const checkQuery = `SELECT * FROM users WHERE email = ? OR username = ? OR phoneNumber = ?`;

    // Check if user exists
    const users = await query(checkQuery, [identifier, identifier, identifier]);

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = users[0];

    // Check if the user is verified
    if (user.isVerified === "false") {
      return res.status(403).json({
        success: false,
        message:
          "Account not verified. Please check your email for verification instructions.",
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        // role: user.role,
      },
      JWT_SECRET_KEY,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // console.log(token);
    // Set cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      // maxAge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      expires: new Date(Date.now() + parseInt(COOKIE_EXPIRES_IN)),
    });

    logger.info(
      `Logged user userId: ${user.userId}\t loggedIn as: ${identifier}`
    );
    // Login successful

    console.log(user.totalBalance);
    return (
      res
        .status(200)
        // .cookie("access_token", token, {
        //   httpOnly: true,
        //   sameSite: "none",
        //   secure: true,
        //   path: "/",
        //   maxAge: new Date(Date.now() + +COOKIE_EXPIRES_IN),
        //   // maxAge: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),

        //   // expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        //   // httpOnly: true,
        //   // sameSite: "none",
        //   // secure: true,
        // })
        .json({
          success: true,
          message: "Login successful",
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            referralCode: user.referralCode,
            avatar: user.avatar,
            status: user.status,
            totalBalance: user.totalBalance,
            isVerified: user.isVerified,
            token,
          },
        })
    );
  } catch (error) {
    logger.error(`${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// logout user
exports.logOutUser = asyncHandler(async (req, res) => {
  try {
    // Clear the JWT cookie
    res.cookie("access_token", "", {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // Logout successful
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(`${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Function to clear cookies
// const clearCookie = (res, cookieName) => {
//   res.clearCookie(cookieName, null, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "none",
//     path: "/",
//   });
// };

// Logout user endpoint
// exports.logOutUser = asyncHandler(async (req, res) => {
//   try {
//     clearCookie(res, "access_token");

//     return res.status(200).json({
//       success: true,
//       message: "Logout successful",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// Forgot password handler
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate input data
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Check if the user exists
  const user = await query("SELECT * FROM users WHERE email = ?", [email]);

  if (user.length === 0) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const userEmail = user[0].email;

  // Generate a JWT reset token
  const resetToken = jwt.sign(
    { email: userEmail },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );

  // Create reset URL
  const resetURL = `${FRONTEND_URL}/reset-password/${resetToken}`;

  // Send the email
  try {
    await sendMail({
      from: process.env.SMTP_MAIL,
      to: userEmail,
      subject: "Password Reset",
      text: `You requested a password reset. Click the link to reset your password: ${resetURL}`,
    });
    logger.info(`Password reset email sent to: ${userEmail}`);
    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    logger.error(`Error sending email: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error sending email. Please try again later.",
    });
  }
});

// Reset password handler
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Validate input data
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: "New password is required",
    });
  }

  // Verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const { email } = decoded;

  // Check if the user exists
  const users = await query("SELECT * FROM users WHERE email = ?", [email]);

  if (users.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No user found",
    });
  }

  // Hash the new password
  const hashPassword = bcrypt.hashSync(newPassword, 10);

  // Update the password in the database
  await query("UPDATE users SET password = ? WHERE email = ?", [
    hashPassword,
    email,
  ]);

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});
