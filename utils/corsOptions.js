const whitelist = [
  "https://196.201.214.200",
  "https://196.201.214.206",
  "https://196.201.213.114",
  "https://196.201.214.207",
  "https://196.201.214.208",
  "https://196.201.213.44",
  "https://196.201.212.127",
  "https://196.201.212.138",
  "https://196.201.212.129",
  "https://196.201.212.136",
  "https://196.201.212.74",
  "https://196.201.212.69",
];

// Add the environment variable to the whitelist
if (process.env.FRONTEND_URL) {
  whitelist.push(process.env.FRONTEND_URL);
}

const origin = (origin, callback) => {
  if (whitelist.indexOf(origin) !== -1 || !origin) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

const corsOptions = {
  origin: origin,
  credentials: true, // This allows cookies and other credentials to be sent in cross-origin requests
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

module.exports = { corsOptions };

/**
 * 196.201.214.200
196.201.214.206
196.201.213.114
196.201.214.207
196.201.214.208
196. 201.213.44
196.201.212.127
196.201.212.138
196.201.212.129
196.201.212.136
196.201.212.74
196.201.212.69
 */
