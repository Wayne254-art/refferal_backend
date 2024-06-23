const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { generateUUID } = require("./helperFunctions");
const logger = require("./logger");

const SERVER_URL = process.env.SERVER_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

const generateQRCode = async (referralCode) => {
  try {
    // URL to be encoded in the QR code
    const url = `${FRONTEND_URL}/signup?referralCode=${referralCode}`;

    // Generate a unique ID for the QR code
    const qrCodeId = generateUUID();

    // Path where the QR code image will be saved in the 'uploads' directory
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "qrcodes",
      `${qrCodeId}.png`
    );
    const imageUrl = `${SERVER_URL}/uploads/qrcodes/${qrCodeId}.png`;

    // Ensure the directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Generate QR code and save it to the file
    await QRCode.toFile(filePath, url);

    console.log(`QR code saved to ${filePath} & QR code URL ${imageUrl}`);
    logger.info(`QR code saved to ${filePath} & QR code URL ${imageUrl}`);
    return { filePath, qrCodeId, imageUrl };
  } catch (err) {
    console.error(`Error generating QR code: ${err.message}`);
    logger.error(`Error generating QR code: ${err.message}`);
    return null; // Return null in case of an error
  }
};

module.exports = generateQRCode;
