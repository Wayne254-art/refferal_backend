const {
  initiateSTKPush,
  stkPushCallback,
  confirmPayment,
} = require("../controllers/payments.controller");
const { isAdmin, isAuthenticated } = require("../middleware/auth.middleware");

const router = require(`express`).Router();

router.post(`/mpesa/stkPush`, isAuthenticated, initiateSTKPush);
router.post(`/mpesa/recieved-callbackmetadata`, stkPushCallback);
router.post(`/mpesa/confirm-payment/:CheckoutRequestID`, confirmPayment);

module.exports = router;
