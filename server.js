const express = require("express");
const path = require("path");

const config = require("./config");
const logger = require("./utils/logger");

const corsMiddleware = require("./middleware/cors.middleware");
const requestLogger = require("./middleware/logger.middleware");
const errorHandler = require("./middleware/errorHandler.middleware");
const notFound = require("./middleware/notFound.middleware");
const { apiLimiter } = require("./middleware/rateLimit.middleware");

const apiRoutes = require("./routes");
const healthRoutes = require("./routes/health.routes");

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

// ── Health check (no rate limit, no auth) ─────────────────────────────────────
app.use("/health", healthRoutes);

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api", apiLimiter, apiRoutes);

// ── Static build (production) ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ── Error handling (must be last) ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  logger.sysinfo(`Environment : ${config.env}`);
  logger.info(`Server      : http://localhost:${config.port}`);
  logger.info(`API         : http://localhost:${config.port}/api`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`Port ${config.port} is already in use.`);
    logger.error("Set a different port via PORT= environment variable.");
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = app;
