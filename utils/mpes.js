const axios = require("axios");

const getAccessToken = async () => {
  const consumerKey = "d8sF74aE4H5pp8bZbPD1HMmX7LKi2Z95rGkAz0gyztFU8dYh";
  const consumerSecret =
    "Gnsj16OSwLKrNGCOFOJCedoCv8BUATKApq8Bi66fDr63zRJZ76FaRTGhzis4xQjE";

  //choose one depending on you development environment
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"; //sandbox
  // const url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",  //live

  try {
    const encodedCredentials = new Buffer.from(
      consumerKey + ":" + consumerSecret
    ).toString("base64");

    const headers = {
      Authorization: "Basic" + " " + encodedCredentials,
      "Content-Type": "application/json",
    };

    const response = await axios.get(url, { headers });
    return response.data.access_token;
  } catch (error) {
    throw new Error("Failed to get access token.");
  }
};

async function sendStkPush() {
  const token = await getAccessToken();
  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  //you can use momentjs to generate the same in one line

  const shortCode = "174379"; //sandbox -174379
  const passkey =
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

  const stk_password = new Buffer.from(
    shortCode + passkey + timestamp
  ).toString("base64");

  //choose one depending on you development environment
  const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
  //   const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };

  const requestBody = {
    BusinessShortCode: shortCode,
    Password: stk_password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", //till "CustomerBuyGoodsOnline"
    Amount: "1",
    PartyA: "254742275513",
    PartyB: shortCode,
    PhoneNumber: "254742275513",
    CallBackURL: "https://yourwebsite.co.ke/callbackurl",
    AccountReference: "account",
    TransactionDesc: "test",
  };

  try {
    const response = await axios.post(url, requestBody, { headers });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

sendStkPush();
