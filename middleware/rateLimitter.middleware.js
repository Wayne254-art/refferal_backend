const { rateLimit } = require("express-rate-limit");
const logger = require("../utils/logger");

const loginLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message:
      "Too many login attempts from this IP, please try again after 60 seconds pause.",
  },
  handler: (req, res, next, options) => {
    logger.error(
      `Too many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { loginLimit };
