const multer = require("multer");
const { generateUUID } = require("../utils/helperFunctions");
const logger = require("../utils/logger");

// Define the upload path for images
const uploadPath = "uploads/images/";

// Define the storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = generateUUID();
    cb(null, `${uniqueSuffix}.png`);
  },
});

// Define the file filter function to allow only images
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    const error = new Error("Only image files are allowed!");
    error.success = false;
    logger.error(`File upload error: ${error.message}`);
    return cb(error);
  }
  cb(null, true);
};

// Define file size limit (2MB)
const limits = { fileSize: 2000000 }; // 2MB file size limit

// Configure multer with storage, limits, and file filter
const upload = multer({ storage, limits, fileFilter });

module.exports = { upload };
