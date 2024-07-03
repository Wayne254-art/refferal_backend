const {
  getUsersReferrals,
  getUsersReferralsCount,
  getUsersReferralsActiveCount,
  getUsersReferralsInactiveCount,
  getActiveUsersReferrals,
  getInactiveUsersReferrals,
} = require("../controllers/referral.controller");
const { isAuthenticated } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.get(`/get-all-user-referrals/:userId`, isAuthenticated, getUsersReferrals);
router.get(`/get-all-user-referrals-count/:userId`, isAuthenticated, getUsersReferralsCount);
router.get(`/get-all-active-user-referrals/:userId`,isAuthenticated, getActiveUsersReferrals);
router.get(`/get-all-inactive-user-referrals/:userId`, getInactiveUsersReferrals);
router.get(`/get-all-active-user-referrals-count/:userId`, getUsersReferralsActiveCount);
router.get(`/get-all-inactive-user-referrals-count/:userId`, getUsersReferralsInactiveCount);

module.exports = router;