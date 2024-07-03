// const asyncHandler = require("express-async-handler");
// const logger = require("../utils/logger");
// const { db } = require("../Database/database");
// const { promisify } = require("util");
// const { generateUUID } = require("../utils/helperFunctions");
// const axios = require("axios");
// const query = promisify(db.query).bind(db);

// //mpesa configs
// const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
// const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
// const shortCode = process.env.MPESA_SHORTCODE;
// const passkey = process.env.MPESA_PASSKEY;

// // function for generating accessToken
// const getAccessToken = async () => {
//   const url = process.env.SAFARICOM_AUTH_URL;

//   try {
//     const authPassword = Buffer.from(
//       consumerKey + ":" + consumerSecret
//     ).toString("base64");

//     const headers = {
//       Authorization: "Basic " + authPassword,
//       "Content-Type": "application/json",
//     };

//     const response = await axios.get(url, { headers });
//     return response.data.access_token;
//   } catch (error) {
//     throw new Error("Failed to get access token.");
//   }
// };

// // function for generating timestamp
// const generateTimestamp = async () => {
//   const date = new Date();
//   const timestamp =
//     date.getFullYear() +
//     ("0" + (date.getMonth() + 1)).slice(-2) +
//     ("0" + date.getDate()).slice(-2) +
//     ("0" + date.getHours()).slice(-2) +
//     ("0" + date.getMinutes()).slice(-2) +
//     ("0" + date.getSeconds()).slice(-2);

//   return timestamp;
// };

// // Function to format the phone number
// const formatPhoneNumber = (phoneNumber) => {
//   if (phoneNumber.startsWith("0")) {
//     return "254" + phoneNumber.slice(1);
//   } else if (phoneNumber.startsWith("+")) {
//     return phoneNumber.replace("+", "");
//   } else if (phoneNumber.startsWith("254")) {
//     return phoneNumber;
//   } else {
//     logger.error(`Invalid phone number format: ${phoneNumber}`);
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid phone number format" });
//   }
// };

// // Controller function to generate STK Push
// exports.initiateSTKPush = asyncHandler(async (req, res) => {
//   let { phoneNumber, amount, userId } = req.body;

//   phoneNumber = formatPhoneNumber(phoneNumber);

//   // check if user exists
//   const checkQuery = `SELECT * FROM users WHERE userId = ? `;
//   const user = await query(checkQuery, [userId]);

//   if (user.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: "User not found",
//     });
//   }

//   try {
//     const token = await getAccessToken();
//     const timestamp = await generateTimestamp();

//     const stk_password = Buffer.from(shortCode + passkey + timestamp).toString(
//       "base64"
//     );

//     const url = process.env.MPESA_STK_PUSH_URL;
//     const headers = {
//       Authorization: "Bearer " + token,
//       "Content-Type": "application/json",
//     };

//     const requestBody = {
//       BusinessShortCode: shortCode,
//       Password: stk_password,
//       Timestamp: timestamp,
//       TransactionType: "CustomerPayBillOnline",
//       Amount: amount,
//       PartyA: phoneNumber,
//       PartyB: shortCode,
//       PhoneNumber: phoneNumber,
//       CallBackURL: process.env.MPESA_CALLBACK_URL,
//       AccountReference: "Payment",
//       TransactionDesc: "Payment description",
//     };

//     const stkPush = await axios.post(url, requestBody, { headers });
//     // return res.json(response.data);
//     // console.log("Mpesa response:", stkPush.data);

//     res.status(200).json({
//       success: true,
//       message: "STK Push initiated check your phone to procced",
//       data: stkPush.data,
//     });
//   } catch (error) {
//     console.error(error.response.data);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Handle callback url
// exports.stkPushCallback = asyncHandler(async (req, res) => {
//   try {
//     const callbackData = req.body;
//     console.log("callBack Data", callbackData);

//     // Check the result code
//     const result_code = callbackData.Body.stkCallback.ResultCode;
//     if (result_code !== 0) {
//       // If the result code is not 0, there was an error
//       const error_message = callbackData.Body.stkCallback.ResultDesc;
//       const response_data = {
//         ResultCode: result_code,
//         ResultDesc: error_message,
//       };
//       return res.status(400).json({
//         success: false,
//         message: "Payment not made",
//         data: response_data,
//       });
//     }

//     const {
//       MerchantRequestID,
//       CheckoutRequestID,
//       ResultCode,
//       ResultDesc,
//       CallbackMetadata,
//     } = req.body.Body.stkCallback;

//     // If the result code is 0, the transaction was completed
//     const body = req.body.Body.stkCallback.CallbackMetadata;

//     // Get amount
//     const amountObj = body.Item.find((obj) => obj.Name === "Amount");
//     const amount = amountObj.Value;

//     // Get Mpesa code
//     const codeObj = body.Item.find((obj) => obj.Name === "MpesaReceiptNumber");
//     const mpesaCode = codeObj.Value;

//     // Get phone number
//     const phoneNumberObj = body.Item.find((obj) => obj.Name === "PhoneNumber");
//     const phone = phoneNumberObj.Value;

//     // Get Transaction Date
//     const TransactionDateObj = body.find(
//       (obj) => obj.Name === "TransactionDate"
//     );
//     const TransactionDate = TransactionDateObj.Value;

//     // Save the variables to a file or database, etc.
//     // ...
//     console.log("-".repeat(20), " OUTPUT IN THE CALLBACK ", "-".repeat(20));
//     console.log(`
//             UserId : ${userId},
//             MerchantRequestID : ${MerchantRequestID},
//             CheckoutRequestID: ${CheckoutRequestID},
//             ResultCode: ${ResultCode},
//             ResultDesc: ${ResultDesc},
//             PhoneNumber : ${phone},
//             Amount: ${amount},
//             MpesaReceiptNumber: ${mpesaCode},
//             TransactionDate : ${TransactionDate}
//         `);

//     // Return a success response to mpesa
//     return res
//       .status(200)
//       .json({ success: true, message: "Payment recieved successfully" });
//   } catch (error) {
//     console.error("Error in STK Push Callback:", error.message);
//     logger.error(`Error in STK Push Callback: ${error.message}`);
//     return res
//       .status(500)
//       .json({ success: false, error: "Internal Server Error" });
//   }
// });

// // @desc Check from safaricom servers the status of a transaction
// // @method GET
// // @route /confirmPayment/:CheckoutRequestID
// // @access public
// exports.confirmPayment = asyncHandler(async (req, res) => {
//   const url = process.env.SAFARICOM_QUERY_URL;
//   const { CheckoutRequestID } = req.params;

//   try {
//     const token = await getAccessToken();
//     const timestamp = await generateTimestamp();

//     const password = Buffer.from(shortCode + passkey + timestamp).toString(
//       "base64"
//     );

//     const headers = {
//       Authorization: "Bearer " + token,
//       "Content-Type": "application/json",
//     };

//     const options = {
//       BusinessShortCode: shortCode,
//       Password: password,
//       Timestamp: timestamp,
//       CheckoutRequestID: CheckoutRequestID,
//     };

//     const response = await axios.post(url, options, { headers });

//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error("Error while trying to create LipaNaMpesa details", error);
//     logger.error(
//       `Error while trying to create LipaNaMpesa details: ${error.message}`
//     );
//   }
// });

const asyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const { db } = require("../Database/database");
const { promisify } = require("util");
const { generateUUID } = require("../utils/helperFunctions");
const axios = require("axios");
const query = promisify(db.query).bind(db);

// mpesa configs
const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
const shortCode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;

// Function for generating accessToken
const getAccessToken = async () => {
  const url = process.env.SAFARICOM_AUTH_URL;
  try {
    const authPassword = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${authPassword}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(url, { headers });
    return response.data.access_token;
  } catch (error) {
    throw new Error("Failed to get access token.");
  }
};

// Function for generating timestamp
const generateTimestamp = () => {
  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  return timestamp;
};

// Function to format the phone number
const formatPhoneNumber = (phoneNumber) => {
  if (phoneNumber.startsWith("0")) {
    return "254" + phoneNumber.slice(1);
  } else if (phoneNumber.startsWith("+")) {
    return phoneNumber.replace("+", "");
  } else if (phoneNumber.startsWith("254")) {
    return phoneNumber;
  } else {
    logger.error(`Invalid phone number format: ${phoneNumber}`);
    throw new Error("Invalid phone number format");
  }
};

// Controller function to generate STK Push
exports.initiateSTKPush = asyncHandler(async (req, res) => {
  let { phoneNumber, amount, userId } = req.body;

  try {
    phoneNumber = formatPhoneNumber(phoneNumber);

    // Check if user exists
    const checkQuery = `SELECT * FROM users WHERE userId = ?`;
    const user = await query(checkQuery, [userId]);

    if (user.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const token = await getAccessToken();
    const timestamp = generateTimestamp();
    const stkPassword = Buffer.from(shortCode + passkey + timestamp).toString(
      "base64"
    );

    const url = process.env.MPESA_STK_PUSH_URL;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const requestBody = {
      BusinessShortCode: 5124252,
      Password: stkPassword,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", // "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: 4529088,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Payment",
      TransactionDesc: "Payment description",
    };

    const stkPush = await axios.post(url, requestBody, { headers });

    res.status(200).json({
      success: true,
      message: "STK Push initiated, check your phone to proceed",
      data: stkPush.data,
    });
  } catch (error) {
    console.error("Error initiating STK Push:", error.message);
    logger.error(`Error initiating STK Push: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle callback url
exports.stkPushCallback = asyncHandler(async (req, res) => {
  try {
    const callbackData = req.body;
    console.log("callBack Data", callbackData);

    const result_code = callbackData.Body.stkCallback.ResultCode;
    if (result_code !== 0) {
      const error_message = callbackData.Body.stkCallback.ResultDesc;
      return res.status(400).json({
        success: false,
        message: "Payment not made",
        data: {
          ResultCode: result_code,
          ResultDesc: error_message,
        },
      });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callbackData.Body.stkCallback;

    const amountObj = CallbackMetadata.Item.find(
      (obj) => obj.Name === "Amount"
    );
    const amount = amountObj.Value;

    const codeObj = CallbackMetadata.Item.find(
      (obj) => obj.Name === "MpesaReceiptNumber"
    );
    const mpesaCode = codeObj.Value;

    const phoneNumberObj = CallbackMetadata.Item.find(
      (obj) => obj.Name === "PhoneNumber"
    );
    const phone = phoneNumberObj.Value;

    const TransactionDateObj = CallbackMetadata.Item.find(
      (obj) => obj.Name === "TransactionDate"
    );
    const TransactionDate = TransactionDateObj.Value;

    // Save the variables to a file or database, etc.
    console.log("-".repeat(20), " OUTPUT IN THE CALLBACK ", "-".repeat(20));
    console.log(`
      MerchantRequestID : ${MerchantRequestID},
      CheckoutRequestID: ${CheckoutRequestID},
      ResultCode: ${ResultCode},
      ResultDesc: ${ResultDesc},
      PhoneNumber : ${phone},
      Amount: ${amount}, 
      MpesaReceiptNumber: ${mpesaCode},
      TransactionDate : ${TransactionDate}
    `);

    return res
      .status(200)
      .json({ success: true, message: "Payment received successfully" });
  } catch (error) {
    console.error("Error in STK Push Callback:", error.message);
    logger.error(`Error in STK Push Callback: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// @desc Check from safaricom servers the status of a transaction
// @method GET
// @route /confirmPayment/:CheckoutRequestID
// @access public
exports.confirmPayment = asyncHandler(async (req, res) => {
  const url = process.env.SAFARICOM_QUERY_URL;
  const { CheckoutRequestID } = req.params;

  try {
    const token = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = Buffer.from(shortCode + passkey + timestamp).toString(
      "base64"
    );

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const options = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: CheckoutRequestID,
    };

    const response = await axios.post(url, options, { headers });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error while trying to confirm payment", error.message);
    logger.error(`Error while trying to confirm payment: ${error.message}`);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
