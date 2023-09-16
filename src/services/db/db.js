const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { isEmpty } = require("lodash");
const path = require("path");

const config = require("../../config");
const logger = require("../../utils/logger");
const { UserModel } = require("../../models/userModel");
const { LanguageCodeModel } = require("../../models/languageModel");
const { TagsModel } = require("../../models/tagModel");
const { errorHandlerBot } = require("../../utils/utiles");

const fileName = path.basename(__filename);

const createDefaultUser = async () => {
  try {
    const user = await UserModel.findOne({ phoneNumber: "998915411998" });
    if (!user) {
      const hashedPassword = await bcrypt.hash("root25", config.SECRET);
      const newUser = new UserModel({
        firstName: "Aslamjon",
        lastName: "Ibragimov",
        phoneNumber: "998915411998",
        password: hashedPassword,
        role: "superadmin",
      });

      await newUser.save();
    }
  } catch (e) {
    errorHandlerBot(e, createDefaultUser.name, fileName, e.message);
  }
};

const createDefaultLanguage = async () => {
  try {
    const codes = await LanguageCodeModel.find();
    if (isEmpty(codes)) {
      const newCode1 = new LanguageCodeModel({ name: "uz", code: "uz" });
      const newCode2 = new LanguageCodeModel({ name: "eng", code: "eng" });
      const newCode3 = new LanguageCodeModel({ name: "ru", code: "ru" });
      await newCode1.save();
      await newCode2.save();
      await newCode3.save();
    }
  } catch (e) {
    errorHandlerBot(e, createDefaultLanguage.name, fileName, e.message);
  }
};

const createDefaultTag = async () => {
  try {
    const tag = await TagsModel.find();
    if (isEmpty(tag)) {
      const newTag = new TagsModel({ name: "eng-uz" });
      await newTag.save();
    }
  } catch (e) {
    errorHandlerBot(e, createDefaultTag.name, fileName, e.message);
  }
};

const connectDb = async () => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(config.MONGODB_URL, {
        dbName: config.DB_NAME,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        auth: {
          username: config.MONGO_USER,
          password: config.MONGO_PASSWORD,
        },
      })
      .then(async () => {
        logger.info("Mongodb is connected");
        try {
          await createDefaultUser();
          await createDefaultLanguage();
          await createDefaultTag();

          resolve();
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        logger.error("err", err);
        reject(err);
        process.exit(1);
      });
  });
};

module.exports = {
  connectDb,
};
