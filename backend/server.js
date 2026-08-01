const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: process.env.NODE_ENV === "production"
    ? ".env.production"
    : (process.env.USE_RAILWAY === "true" ? ".env.railway" : ".env.local"),
});

const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const orderRoutes = require("./routes/orderRoutes");
const walletRoutes = require("./routes/walletRoutes");
const nearbyRoutes = require("./routes/nearbyRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const sellerLocationRoutes = require("./routes/sellerLocationRoutes");
const leadChargeRoutes = require("./routes/leadChargeRoutes");
const searchRoutes = require("./routes/searchRoutes");
const leadRoutes = require("./routes/leadRoutes");
const policyRoutes = require("./routes/policyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect DB ───────────────────────────────────────────────────────────────
const { ensureLeadTables } = require("./controllers/leadController");
const { ensureStoredProcedures } = require("./utils/storedProcedures");
connectDB().then(async () => {
  try {
    await ensureLeadTables();
    logger.info("✅ Lead tables verified/created");
    await ensureStoredProcedures();
  } catch (err) {
    logger.error("❌ Failed to ensure database initial tables/procedures:", err);
  }
});

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.startsWith("http://localhost:") || 
                        origin.startsWith("http://127.0.0.1:");
                        
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.error(`CORS Blocked: Origin ${origin} is not in allowed origins: ${JSON.stringify(allowedOrigins)}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Simple custom cookie parser middleware to populate req.cookies
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        req.cookies[name] = decodeURIComponent(val);
      }
    });
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestLogger);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "QuickSeva API is running 🚀",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/nearby", nearbyRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api", sellerLocationRoutes);
app.use("/api", leadChargeRoutes);
app.use("/api", leadRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/admin", adminRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const http = require("http");
const { initSocket } = require("./utils/socketService");
const { startAvailabilitySafetyCheck } = require("./services/availabilitySafetyCheck");

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 QuickSeva API running on http://localhost:${PORT}`);
  logger.info(`📋 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  
  // Start the background safety check
  startAvailabilitySafetyCheck();
});

module.exports = app;
