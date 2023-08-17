const { get } = require("lodash");
const path = require("path");

const isProduction = () => {
  const env = process.env.NODE_ENV || "development";
  const isProduction = env === "production";
  return isProduction;
};

const getVarable = (name) => {
  if (isProduction()) return get(process.env, `${name}_PRODUCTION`) ? get(process.env, `${name}_PRODUCTION`) : "production_env_not_found";
  else return get(process.env, `${name}_DEVELOPMENT`) ? get(process.env, `${name}_DEVELOPMENT`) : "development_env_not_found";
};

const config = {
  APP_NAME: "flashcard",
  API_ROOT: getVarable("APP_BASE_URL"),
  MONGODB_URL: getVarable("MONGO_URL"),
  MONGO_USER: getVarable("MONGO_USER"),
  MONGO_PASSWORD: getVarable("MONGO_PASSWORD"),
  DB_NAME: process.env.DB_NAME,
  DEFAULT_LANG_CODE: "uz",
  PROJECT_ID: 1,
  PORT: process.env.PORT,
  SECRET: process.env.SALT,
  DELETE_ALL_FILES_PATH: getVarable("DELETE_ALL_FILES_PATH"),
  IMAGES_PATH: getVarable("IMAGES_PATH"),
  CACHE_PATH: path.join(__dirname, getVarable("CACHE_PATH")),
  DATA_PATH: getVarable("DATA_PATH"),
  TELEGRAM_BOT_API: getVarable("TELEGRAM_BOT_API"),
  TELEGRAM_BOT_USERNAME: getVarable("TELEGRAM_BOT_USERNAME"),
  LIMIT_FOR_UPLOADING_FILE_SIZE_IN_BAYTE: process.env.LIMIT_FOR_UPLOADING_FILE_SIZE_IN_BAYTE || "1048576",
  TOKEN_TYPE: process.env.TOKEN_TYPE,
};

module.exports = config;
