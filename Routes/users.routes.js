const router = require("express").Router();
const {
  getUser,
  updateAccount,
  getAllUsers,
  changePassword,
  changeUserStatus,
  updateAvatar,
  getSingleUsers,
  deleteUser,
} = require("../controllers/users.controllers");
const { createUser } = require("../controllers/auth.controllers");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

router.get(`/get-user`, isAuthenticated, getUser);
router.patch(`/update-user/:userId`, updateAccount);
router.patch(`/update-user-avatar/:userId`, isAuthenticated, updateAvatar);
router.post(`/change-password/:userId`, changePassword);

// Admin routes
router.post(`/create-user`, isAuthenticated, isAdmin("Admin"), createUser);
router.get(`/get-users`, isAuthenticated, isAdmin("Admin"), getAllUsers);
router.get(`/get-single-user/:userId`, getSingleUsers);
router.delete(
  `/delete-user/:userId`,
  isAuthenticated,
  isAdmin("Admin"),
  deleteUser
);
router.patch(
  `/change-user-status/:userId`,
  isAuthenticated,
  isAdmin("Admin"),
  changeUserStatus
);

module.exports = router;
