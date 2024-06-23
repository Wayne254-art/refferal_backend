// Helper function to get formatted timestamp ih YYYY-MM-DD H:m:s
const getFormattedTimestamp = () => {
  const date = new Date(Date.now() + 3600000); // Add 1 hour (3600000 milliseconds)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// gnereate random uuid
const generateUUID = (a) =>
  a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, generateUUID);

// generate random password

// Specify the password requirements
const passwordRegex =
  /^(?=.*[!@#$%^&()_+])(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,24}$/;

// Function to generate a random password
const generateRandomPassword = () => {
  let password = "";
  const characters =
    "!@#$%^&*()_+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  // Generate a password that meets the requirements
  while (!passwordRegex.test(password)) {
    password = "";
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
  }

  return password;
};

// Generate username from email
const generateFromEmail = (email) => {
  if (!email) {
    throw new Error("Email is required to generate a username");
  }

  const username = email.split("@")[0];
  return username;
};

// Generate random characters
const UniqueCharOTP = (length) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate random numbers
const UniqueOTP = (length) => {
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
};

// Generate random code
const generateReferralCode = () => {
  const charPart = UniqueCharOTP(4);
  const numPart = UniqueOTP(4);
  return charPart + numPart;
};

// // Function to generate QR code and save it as an image
// const generateQRCode = async (userId, referralCode) => {
//   try {
//     // URL to be encoded in the QR code
//     const url = `https://www.yoursite.com?referralCode=${referralCode}`;

//     // Path where the QR code image will be saved
//     const qrCodeId = generateUUID();
//     const filePath = path.join(__dirname, `qrcodes`, `${qrCodeId}.png`);

//     // Generate QR code and save it to the file
//     await QRCode.toFile(filePath, url);

//     console.log(`QR code saved to ${filePath}`);
//     return { filePath, qrCodeId };
//   } catch (err) {
//     console.error(`Error generating QR code: ${err.message}`);
//     throw err;
//   }
// };

module.exports = {
  getFormattedTimestamp,
  generateUUID,
  generateRandomPassword,
  generateFromEmail,
  generateReferralCode,
};
