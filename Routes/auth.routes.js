const express = require("express");
const {
  createUser,
  loginUser,
  logOutUser,
  forgotPassword,
  resetPassword,
  verifyUser,
} = require("../controllers/auth.controllers");
const { loginLimit } = require("../middleware/rateLimitter.middleware");
const { isAuthenticated } = require("../middleware/auth.middleware");
const router = express.Router();

router.post(`/create-user`, createUser);
router.post(`/activate`, verifyUser);
router.post(`/login-user`, loginLimit, loginUser);
router.post(`/logout-user`, isAuthenticated, logOutUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;
