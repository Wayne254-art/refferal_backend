const asyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const { db } = require("../Database/database");
const { promisify } = require("util");
const { generateUUID } = require("../utils/helperFunctions");
const query = promisify(db.query).bind(db);

// Get all user referrals
exports.getUsersReferrals = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const actionQuery = `
      SELECT
        r.referralId,
        r.referrerId,
        r.referredId,
        r.referralCode,
        r.createdAt,
        u1.username AS referrerUsername,
        u1.email AS referrerEmail,
        u2.username AS referredUsername,
        u2.email AS referredEmail
      FROM
        referrals r
      LEFT JOIN
        users u1 ON r.referrerId = u1.userId
      LEFT JOIN
        users u2 ON r.referredId = u2.userId
      WHERE
        r.referrerId = ?
    `;

    const referrals = await query(actionQuery, [userId]);

    if (referrals.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No referrals found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      referrals,
    });
  } catch (error) {
    logger.error(`Error fetching user referrals: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get all user referral count
exports.getUsersReferralsCount = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const actionQuery = `
      SELECT
        COUNT(*) as referralCount
      FROM
        referrals
      WHERE
        referrerId = ?
    `;

    const result = await query(actionQuery, [userId]);

    const referralCount = result[0].referralCount;

    return res.status(200).json({
      success: true,
      referralCount,
    });
  } catch (error) {
    logger.error(`Error fetching user referral count: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get all active user referrals
exports.getActiveUsersReferrals = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const actionQuery = `
      SELECT
        r.referralId,
        r.referralCode,
        r.createdAt,
        u.userId AS referredUserId,
        u.firstName AS referredUserFirstName,
        u.lastName AS referredUserLastName,
        u.email AS referredUserEmail,
        u.phoneNumber AS referredUserPhoneNumber
      FROM
        referrals r
      INNER JOIN
        users u ON r.referredId = u.userId
      WHERE
        r.referrerId = ? AND u.status = '1'
    `;

    const results = await query(actionQuery, [userId]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active referrals found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      activeReferrals: results,
    });
  } catch (error) {
    logger.error(`Error fetching active user referrals: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//Get all inActive user referral count
exports.getInactiveUsersReferrals = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const actionQuery = `
      SELECT
        r.referralId,
        r.referralCode,
        r.createdAt,
        u.userId AS referredUserId,
        u.firstName AS referredUserFirstName,
        u.lastName AS referredUserLastName,
        u.email AS referredUserEmail,
        u.phoneNumber AS referredUserPhoneNumber
      FROM
        referrals r
      INNER JOIN
        users u ON r.referredId = u.userId
      WHERE
        r.referrerId = ? AND u.status = '0'
    `;

    const results = await query(actionQuery, [userId]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No inactive referrals found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      inactiveReferrals: results,
    });
  } catch (error) {
    logger.error(`Error fetching inactive user referrals: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get all active user referral count
exports.getUsersReferralsActiveCount = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const countQuery = `
      SELECT COUNT(*) as activeReferralsCount
      FROM referrals r
      INNER JOIN users u ON r.referredId = u.userId
      WHERE r.referrerId = ? AND u.status = '1'
    `;

    const results = await query(countQuery, [userId]);

    return res.status(200).json({
      success: true,
      activeReferralsCount: results[0].activeReferralsCount,
    });
  } catch (error) {
    logger.error(`Error fetching active user referral count: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//Get all inActive user referral count
exports.getUsersReferralsInactiveCount = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const countQuery = `
      SELECT COUNT(*) as inactiveReferralsCount
      FROM referrals r
      INNER JOIN users u ON r.referredId = u.userId
      WHERE r.referrerId = ? AND u.status = '1'
    `;

    const results = await query(countQuery, [userId]);

    return res.status(200).json({
      success: true,
      inactiveReferralsCount: results[0].inactiveReferralsCount,
    });
  } catch (error) {
    logger.error(
      `Error fetching inactive user referral count: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
