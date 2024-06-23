const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

const { generateUUID } = require("./helperFunctions");

// Define custom log format
const myFormat = printf(({ level, message, timestamp }) => {
  const uuid = generateUUID();
  return `${timestamp}\t${uuid}\t${level}: ${message}`;
});

// Ensure log directory exists
const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Create logger instances
const debugLogger = createLogger({
  level: `debug`,
  format: combine(timestamp({ format: `YYYY-MM-DD \tHH.mm.ss` }), myFormat),

  transports: [
    // new transports.Console(),
    new transports.File({
      filename: path.join(logDir, "debugLogs.log"),
      level: "debug",
    }),
  ],
});

const errorLogger = createLogger({
  level: `error`,
  format: combine(timestamp({ format: `YYYY-MM-DD \tHH.mm.ss` }), myFormat),

  transports: [
    // new transports.Console(),
    new transports.File({
      filename: path.join(logDir, "errorLogs.log"),
      level: "error",
    }),
  ],
});

const eventLogger = createLogger({
  level: `info`,
  format: combine(timestamp({ format: `YYYY-MM-DD \tHH.mm.ss` }), myFormat),

  transports: [
    // new transports.Console(),
    new transports.File({
      filename: path.join(logDir, "eventLogs.log"),
      level: "info",
    }),
  ],
});

// Create a unified logger objesct
const logger = {
  debug: (message) => {
    debugLogger.debug(message);
  },

  error: (message) => {
    errorLogger.error(message);
  },

  info: (message) => {
    eventLogger.info(message);
  },
};

module.exports = logger;
