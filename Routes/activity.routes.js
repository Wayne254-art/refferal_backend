const {
  getTotalAccountBalance,
  getTotalDeposits,
  addDeposit,
  addWithdrawal,
  getAllWithdrawals,
  changeWithdrawalStatus,
  getUserWithdrawals,
  getAllTotalDeposits,
} = require("../controllers/activity.controller");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.get(`/get-totalBalamce`, isAuthenticated, getTotalAccountBalance);
router.get(`/get-totalDeposits/:userId`, getTotalDeposits);
router.get(`/get-all-totalDeposits`, isAuthenticated, isAdmin(`Admin`), getAllTotalDeposits);
router.post(`/add-deposit`, isAuthenticated, addDeposit);
router.post(`/add-withdrawal-request/:userId`, isAuthenticated, addWithdrawal);
router.get(`/get-withdrawal-request`, isAuthenticated, getAllWithdrawals);
router.get(`/get-user-withdrawals/:userId`, getUserWithdrawals);
router.post(
  `/change-withdrawal-status/:requestId`,
  isAuthenticated,
  changeWithdrawalStatus
);

module.exports = router;
