const express = require(`express`);
const app = express();
const cookieParser = require(`cookie-parser`);
const cors = require(`cors`);
const path = require("path");

// Importing routes
const authRoutes = require("./Routes/auth.routes");
const usersRoutes = require("./Routes/users.routes");
const activityRoutes = require("./Routes/activity.routes");
const referralRoutes = require("./Routes/referral.routes");
const paymentsRoutes = require("./Routes/payments.routes");
const { corsOptions } = require("./utils/corsOptions");

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middlewares
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route middlewares
app.use("/api/v2/auth", authRoutes);
app.use("/api/v2/user", usersRoutes);
app.use("/api/v2/activity", activityRoutes);
app.use("/api/v2/referral", referralRoutes);
app.use("/api/v2/payments", paymentsRoutes);

app.get(`/`, (req, res) => {
  res.send(`Hello From the Backend Server`);
});

// not found route
app.all("*", (req, res) => {
  res.status(404).send("This Page is not found");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred.",
  });
});

module.exports = app;
