// Requiring module
const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
require("dotenv").config();
const logger = require("./utils/logger");
const rateLimit = require("express-rate-limit");

const { connectDb } = require("./services/db/db");

const { checkUser } = require("./middlewares/authMiddleware");

// ROUTERS
const { authRouter } = require("./routers/authRouter");

const config = require("./config");
// const { wareHouseRouter } = require("./routers/wareHouseRouter");
// const { clientsRouter } = require("./routers/clientRouter");

const { init: startTelegramBot } = require("./integration/telegram/index");
const { isAdmin } = require("./middlewares/checkPermission");
const { createDefaultFolder, errorHandlerBot, errorHandling, isFile } = require("./utils/utiles");
// const { uploadFile } = require("./controllers/uploadFileController");
const { flashCardRouter } = require("./routers/flashCardRouter");
const { tagRouter } = require("./routers/tagRouter");
const { ratingRouter } = require("./routers/ratingRouter");
// const { checkPermission } = require("./middlewares/checkPermission");
// const { templateRouter } = require("./routers/templateRouter");
// const { salesRouter } = require("./routers/salesRouter");
// const { botRouter } = require("./routers/botRouter");

const app = express();

function shouldCompress(req, res) {
  // don't compress responses with this request header
  if (req.headers["x-no-compression"]) return false;
  // fallback to standard filter function
  return compression.filter(req, res);
}

const limiter = rateLimit({
  // windowMs: 15 * 60 * 1000, // 15 minutes
  windowMs: 1000,
  max: 20, // Limit each IP to 100 requests per `window` (here, per 1 secound)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const corsOptions = {
  allowedHeaders: ["Content-Type", "Authorization", "Content-Length", "withCredentials", "credential", "credentials", "Timezone"],
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
  maxAge: 7200,
};

app.use(cors(corsOptions));

// Apply the rate limiting middleware to API calls only
app.use("/api", limiter);

// COMPRESS MIDDLEWARES
app.use(compression({ filter: shouldCompress }));

// try {
//   createDefaultFolder(config.CACHE_PATH);
//   createDefaultFolder(config.IMAGES_PATH);
//   createDefaultFolder(config.DELETE_ALL_FILES_PATH);
// } catch (e) {
//   errorHandlerBot(e, { name: "index.js" }, "main index.js");
// }

app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use(express.json({ limit: "500mb", extended: true })); // if json come backend then it convert to obj in req.body

app.use("/api/auth", authRouter);
app.use("/api/flash-card", flashCardRouter);
app.use("/api/tag", checkUser, tagRouter);
app.use("/api/rating", checkUser, ratingRouter);
app.get("/ip", (request, response) => response.send(request.ip));
// app.use("/api/upload/file", express.static(config.DATA_PATH + "/"));

// app.get("/api/upload/file/:id", uploadFile);

app.use("/", express.static(path.join(__dirname, "./public")));

app.use(express.static("routes"));

// catch 404 and forward to error handler
app.use(async (req, res, next) => {
  try {
    throw new Error("API Not Found. Please check it and try again.");
  } catch (err) {
    err.status = 404;

    console.log(err.message, err.status, req.method, req.originalUrl);
    next(err);
  }
});

// Error handle
app.use((err, req, res, next) => {
  // console.log("[Global error middleware]", err.message, err.status, req.method, req.url);
  err.status !== 404 &&
    logger.error(`
  [Global error middleware] 
  ${err.message} 
  ${err.status} 
  ${req.method} 
  ${req.url} 
  ${err.stack} `);
  res.status(err.status ? err.status : 500).send({
    error: err.message,
  });
  next();
});

const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  connectDb();
  startTelegramBot();
});
