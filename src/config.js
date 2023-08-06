const path = require("path");

const isProduction = () => {
  const env = process.env.NODE_ENV || "development";
  const isProduction = env === "production";
  return isProduction;
};

const getEnvironments = () => {
  if (isProduction()) return process.env.APP_BASE_URL_PRODUCTION ? process.env.APP_BASE_URL_PRODUCTION : "production_env_not_found";
  else if (!isProduction()) return process.env.APP_BASE_URL_DEVELOPMENT ? process.env.APP_BASE_URL_DEVELOPMENT : "development_env_not_found";

  return "unknown_env";
};

const getMongoDbUrl = () => {
  if (isProduction()) return process.env.MONGO_URL_PRODUCTION ? process.env.MONGO_URL_PRODUCTION : "production_env_not_found";
  else if (!isProduction()) return process.env.MONGO_URL_DEVELOPMENT ? process.env.MONGO_URL_DEVELOPMENT : "development_env_not_found";

  return "unknown_env";
};

const getMongoDBUser = () => {
  if (isProduction()) return process.env.MONGO_USER_PRODUCTION ? process.env.MONGO_USER_PRODUCTION : "production_env_not_found";
  else return process.env.MONGO_USER_DEVELOPMENT ? process.env.MONGO_USER_DEVELOPMENT : "development_env_not_found";
  return "unknown_env";
};

const getMongoDBPassword = () => {
  if (isProduction()) return process.env.MONGO_PASSWORD_PRODUCTION ? process.env.MONGO_PASSWORD_PRODUCTION : "production_env_not_found";
  else return process.env.MONGO_PASSWORD_DEVELOPMENT ? process.env.MONGO_PASSWORD_DEVELOPMENT : "development_env_not_found";
  return "unknown_env";
};

const config = {
  APP_NAME: "PREIVEW",
  API_ROOT: getEnvironments(),
  MONGODB_URL: getMongoDbUrl(),
  MONGO_USER: getMongoDBUser(),
  MONGO_PASSWORD: getMongoDBPassword(),
  DB_NAME: process.env.DB_NAME,
  DEFAULT_LANG_CODE: "uz",
  PROJECT_ID: 1,
  PORT: process.env.PORT,
  SECRET: process.env.SALT,
  DELETE_ALL_FILES_PATH: isProduction() ? process.env.DELETE_ALL_FILES_PATH_PRODUCTION : process.env.DELETE_ALL_FILES_PATH_DEVELOPMENT,
  IMAGES_PATH: isProduction() ? process.env.IMAGES_PATH_PRODUCTION : process.env.IMAGES_PATH_DEVELOPMENT,
  CACHE_PATH: path.join(__dirname, isProduction() ? process.env.CACHE_PATH_PRODUCTION : process.env.CACHE_PATH_DEVELOPMENT),
  DATA_PATH: isProduction() ? process.env.DATA_PATH_PRODUCTION : process.env.DATA_PATH_DEVELOPMENT,
  TELEGRAM_BOT_API: isProduction() ? process.env.TELEGRAM_BOT_API_PRODUCTION : process.env.TELEGRAM_BOT_API_DEVELOPMENT,
  TOKEN_TYPE: process.env.TOKEN_TYPE,
  SMS_CODE_LIMIT: process.env.SMS_CODE_LIMIT,
  TELEGRAM_BOT_USERNAME: isProduction() ? process.env.TELEGRAM_BOT_USERNAME_PRODUCTION : process.env.TELEGRAM_BOT_USERNAME_DEVELOPMENT,
  LIMIT_FOR_UPLOADING_FILE_SIZE_IN_BAYTE: process.env.LIMIT_FOR_UPLOADING_FILE_SIZE_IN_BAYTE || "1048576",
};

module.exports = config;
