const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { isNull, isEmpty, isArray, isString, get, head } = require("lodash");

const { UserModel } = require("../models/userModel");
const { SmsCodeModel } = require("../models/smsCodeModel");
const { BotUserModel } = require("../models/botUserModel");
const { LanguageModel, LanguageCodeModel, LanguageKeysModel, LanguageValuesModel } = require("../models/languageModel");

const { hideFields, errorHandling, smsCodeGenerator, updateFormat, getOneFromModelByQuery, getDataFromModelByQuery } = require("../utils/utiles");
const config = require("../config");
const { bot } = require("../integration/telegram/index");

const fileName = require("path").basename(__filename);

const secret = config.SECRET;

let tempForLanguages = {};

const getDataByQuery = ({ query = {}, Model } = {}) => getDataFromModelByQuery({ Model, query });
const getOneByQuery = ({ query = {}, Model } = {}) => getOneFromModelByQuery({ Model, query });

const formatAndGetLanguageByLang = async (lang) => {
  const languageKeys = await LanguageKeysModel.find();
  const ids = languageKeys.map((doc) => doc._id);

  const query = { languageCode: lang, keyId: { $in: ids } };

  let languages = await LanguageValuesModel.find(query).populate("keyId");
  let result = {};

  languages.forEach((language) => (result[language.keyId.name] = language.value));

  // console.log(languageKeys.length, languages.length);

  // remove keys for balancing
  // let t = {};
  // for (const index in languageKeys) {
  //   // result[languageKeys[index].name] = get(languages[index], "value", null);
  //   t[languageKeys[index].name] = languageKeys[index].name;
  // }
  // languages.forEach((language) => {
  //   delete t[language.keyId.name];
  // });
  // Object.keys(t).forEach(async (k) => {
  //   await LanguageKeysModel.findOneAndRemove({ name: k });
  // });
  // console.log(t);

  tempForLanguages[lang] = result;
  return result;
};

// SALT GENERATOR
// var salt = bcrypt.genSaltSync(10);

const phoneNumberChecker = (phoneNumber, res) => {
  if (isString(phoneNumber) && phoneNumber.startsWith("+")) return res.status(400).send({ error: "send phoneNumber without +" });

  if (isString(phoneNumber) && phoneNumber.length !== 12) return res.status(400).send({ error: "length of phoneNumber is 12" });
  return 0;
};

const smsCodeChecker = async (phoneNumber, smsCodeId, smsCode, res, checked = true) => {
  const smsCodeExists = await getOneFromModelByQuery({ Model: SmsCodeModel, query: { _id: smsCodeId, smsCode, phoneNumber } });
  if (!smsCodeExists) return res.status(400).send({ error: "smsCode not found" });
  else if (smsCodeExists.smsCode !== smsCode) return res.status(400).send({ error: "confirmation_code_incorrect" });
  else if (smsCodeExists.isChecked) return res.status(400).send({ error: "smsCodeId expired" });

  smsCodeExists.isChecked = checked;
  await smsCodeExists.save();

  return 0;
};

const tokenGenerator = (id, role) => {
  const token = jwt.sign({ userId: id, role }, secret, { expiresIn: "5d" });
  const refreshToken = jwt.sign({ userId: id, role }, secret, { expiresIn: "10d" });
  return { token, refreshToken };
};

const sendSMSCode = async (phoneNumber, res) => {
  const botUser = await getOneFromModelByQuery({ Model: BotUserModel, query: { phoneNumber } });
  if (!botUser) return res.status(400).send({ error: `Go to telegram bot and register -> ${config.TELEGRAM_BOT_USERNAME}` });

  const isHave = await SmsCodeModel.find({
    phoneNumber,
    isChecked: false,
    createdAt: { $gte: new Date().getTime() - 1 * 60 * 60 * 1000 },
  });

  // if (isArray(isHave) && isHave.length >= config.SMS_CODE_LIMIT) return res.status(400).send({ error: "you_are_out_of_your_limit" });

  if (!isEmpty(isHave)) {
    isHave.forEach((item) => {
      item.isChecked = true;
      item.save();
    });
  }
  const smsCode = smsCodeGenerator();
  const newSms = new SmsCodeModel({
    phoneNumber,
    smsCode,
  });

  bot.sendMessage(botUser.chatId, `Sizning accountingizga login jarayoni amalga oshirildi, Tasdiqlash kodi: ${smsCode}`);
  await newSms.save();
  return { smsCodeId: newSms._id };
};

const getSmsCode = async (req, res, isCheckPhoneNumber = true) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).send({ error: "phoneNumber error" });

    const checker = phoneNumberChecker(phoneNumber, res);
    if (checker) return checker;

    const { smsCodeId } = await sendSMSCode(phoneNumber, res);

    smsCodeId && res.send({ smsCodeId });
  } catch (e) {
    errorHandling(e, getSmsCode.name, res, fileName);
  }
};

// verifyDataForCreatingUser
const verifyDataForCreatingUser = async ({ phoneNumber, password, confirmPassword, firstName, lastName }, res) => {
  if (!phoneNumber) return res.status(400).send({ error: "phoneNumber error" });
  if (password !== confirmPassword) return res.status(400).send({ error: "check password and confirmPassword then try again" });

  if (isEmpty(firstName)) return res.status(400).send({ error: "firstName is required" });
  if (isEmpty(lastName)) return res.status(400).send({ error: "lastName is required" });

  const checker = phoneNumberChecker(phoneNumber, res);
  if (checker) return checker;

  const phoneNumberExists = await getOneFromModelByQuery({ Model: UserModel, query: { phoneNumber } });
  if (phoneNumberExists) return res.status(400).send({ error: "phoneNumber is already exists" });

  return 0;
};

const login = async (req, res) => {
  const { phoneNumber, password, smsCodeId, smsCode } = req.body;

  try {
    const checker = phoneNumberChecker(phoneNumber, res);
    if (checker) return checker;

    if (!phoneNumber || !password || isEmpty(smsCodeId)) return res.status(400).send({ error: `Send phoneNumber, password and smsCodeId` });

    const user = await UserModel.findOne({ phoneNumber });
    if (!user) return res.status(400).send({ error: "Login is incorrect" });
    else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).send({ error: "Password is incorrect" });
      else {
        const smsChecker = await smsCodeChecker(phoneNumber, smsCodeId, smsCode, res);
        if (smsChecker) return smsChecker;

        const { token, refreshToken } = tokenGenerator(user._id.toString(), get(user, "role"));

        res.status(200).send({ accessToken: token, refreshToken, tokenType: config.TOKEN_TYPE });
      }
    }
  } catch (e) {
    errorHandling(e, login.name, res, fileName);
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const checker = phoneNumberChecker(phoneNumber, res);
    if (checker) return checker;

    if (!phoneNumber || !password) return res.status(400).send({ error: `Send phoneNumber and password` });

    const user = await UserModel.findOne({ phoneNumber });
    if (!user) return res.status(400).send({ error: "Login is incorrect" });
    else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).send({ error: "Password is incorrect" });
      else getSmsCode(req, res, false);
    }
  } catch (e) {
    errorHandling(e, verifyPassword.name, res, fileName);
  }
};

const verifyCreatingUser = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const isNotVerify = await verifyDataForCreatingUser(req.body, res);
    if (isNotVerify) return isNotVerify;

    const { smsCodeId } = await sendSMSCode(phoneNumber, res);
    smsCodeId && res.send({ data: { smsCodeId } });
  } catch (e) {
    errorHandling(e, verifyDataForCreatingUser.name, res, fileName);
  }
};

const createUser = async (req, res) => {
  const { phoneNumber, password, confirmPassword, firstName, lastName, smsCodeId, smsCode } = req.body;

  try {
    if (!smsCodeId) return res.status(400).send({ error: "smsCodeId is required" });

    const isNotVerify = await verifyDataForCreatingUser(req.body, res);
    if (isNotVerify) return isNotVerify;

    const smsChecker = await smsCodeChecker(phoneNumber, smsCodeId, smsCode, res);
    if (smsChecker) return smsChecker;

    const botUser = await BotUserModel.findOne({ phoneNumber });
    if (!botUser) return res.status(400).send({ error: "bot user is not found" });

    const hashedPassword = await bcrypt.hash(password, secret);
    const newUser = new UserModel({
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      botUserId: botUser._id.toString(),
    });
    await newUser.save();
    const id = newUser._id.valueOf();
    const role = newUser.role;

    const { token, refreshToken } = tokenGenerator(id, role);

    res.status(200).send({ accessToken: token, refreshToken, tokenType: config.TOKEN_TYPE });
  } catch (e) {
    errorHandling(e, createUser.name, res, fileName);
  }
};

const me = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId, hideFields());
    res.send({
      data: user,
    });
  } catch (e) {
    errorHandling(e, me.name, res, fileName);
  }
};

const checkPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const checker = phoneNumberChecker(phoneNumber, res);
    if (checker) return checker;
    const user = await getOneFromModelByQuery({ Model: UserModel, query: { phoneNumber } });
    res.send({ registered: !isNull(user) });
  } catch (e) {
    errorHandling(e, checkPhoneNumber.name, res, fileName);
  }
};

const verifyPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const checker = phoneNumberChecker(phoneNumber, res);
    if (checker) return checker;

    let phoneNumberExists = await getOneFromModelByQuery({ Model: UserModel, query: { phoneNumber } });
    if (!phoneNumberExists) return res.status(400).send({ error: "phoneNumber not found" });

    const { smsCodeId } = await sendSMSCode(phoneNumber, res);

    if (smsCodeId) res.send({ smsCodeId });
  } catch (e) {
    errorHandling(e, verifyPhoneNumber.name, res, fileName);
  }
};

const verifySmsCodeForForgot = async (req, res) => {
  try {
    const { phoneNumber, smsCode, smsCodeId } = req.body;

    const smsChecker = await smsCodeChecker(phoneNumber, smsCodeId, smsCode, res, false);
    if (smsChecker) return smsChecker;
    res.send({ message: "ok" });
  } catch (e) {
    errorHandling(e, verifySmsCode.name, res, fileName);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { phoneNumber, smsCodeId, smsCode, password } = req.body;
    if (!phoneNumber) return res.status(400).send({ error: "phoneNumber  is required" });
    if (!password) return res.status(400).send({ error: "password is required" });

    const checker = phoneNumberChecker(phoneNumber, res);
    if (checker) return checker;

    if (!phoneNumber || !smsCode || !smsCodeId || !password)
      return res.status(400).send({ message: `Send phoneNumber, password, smsCode and smsCodeId` });

    let phoneNumberExists = await getOneFromModelByQuery({ Model: UserModel, query: { phoneNumber } });
    if (!phoneNumberExists) return res.status(400).send({ error: "phoneNumber not found" });

    const smsChecker = await smsCodeChecker(phoneNumber, smsCodeId, smsCode, res);
    if (smsChecker) return smsChecker;

    const hashedPassword = await bcrypt.hash(password, secret);

    phoneNumberExists.password = hashedPassword;
    phoneNumberExists = updateFormat({ item: phoneNumberExists, id: phoneNumberExists._id });
    await phoneNumberExists.save();

    const { token, refreshToken } = tokenGenerator(phoneNumberExists._id, phoneNumberExists.role);

    res.status(200).send({ accessToken: token, refreshToken, tokenType: config.TOKEN_TYPE });
  } catch (e) {
    errorHandling(e, forgotPassword.name, res, fileName);
  }
};

const createAdmin = async (req, res) => {
  try {
    const { phoneNumber, password, firstName, lastName, role = "admin" } = req.body;

    if (isEmpty(phoneNumber) || isEmpty(password) || isEmpty(firstName) || isEmpty(lastName))
      return res.status(400).send({ error: "phoneNumber, password, firstName, lastName is required" });

    if (role !== "admin" && role !== "superadmin") return res.status(400).send({ error: "role is invalid" });

    const user = await UserModel.findOne({ phoneNumber });
    if (user) return res.status(400).send({ error: "user already has been registered" });

    const hashedPassword = await bcrypt.hash(password, secret);
    const newUser = new UserModel({
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    res.status(200).send({ message: "success", data: newUser });
  } catch (e) {
    errorHandling(e, createAdmin.name, res, fileName);
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId === id) return res.status(400).send({ error: "you can not delete yourseft" });
    const result = await UserModel.findById(id);
    if (get(result, "phoneNumber") !== "998915411998") {
      await result.delete();
    }
    return res.send({ message: "admin has been deleted" });
  } catch (e) {
    errorHandling(e, removeAdmin.name, res, fileName);
  }
};

const addLanguage = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (isEmpty(code) || isEmpty(name)) return res.status(400).send({ error: `code and name is required` });
    const one = await LanguageCodeModel({ code });

    if (one) return res.status(400).send({ error: `${code} already exists` });

    const newLanguage = new LanguageCodeModel({
      code,
      name,
    });
    await newLanguage.save();
    res.send(newLanguage);
  } catch (e) {
    errorHandling(e, addLanguage.name, res, fileName);
  }
};

const getLanguages = async (req, res) => {
  try {
    const { lang } = req.params;

    if (!isEmpty(tempForLanguages[lang])) return res.send(tempForLanguages[lang]);

    const codes = await LanguageCodeModel.find();
    if (isEmpty(codes)) {
      const newCode1 = new LanguageCodeModel({ name: "uz", code: "uz" });
      const newCode2 = new LanguageCodeModel({ name: "ru", code: "ru" });
      const newCode3 = new LanguageCodeModel({ name: "eng", code: "eng" });
      await newCode1.save();
      await newCode2.save();
      await newCode3.save();
    }

    await formatAndGetLanguageByLang(lang);

    res.send(tempForLanguages[lang]);
  } catch (e) {
    errorHandling(e, getLanguages.name, res, fileName);
  }
};

const setKeyLanguage = async (req, res) => {
  try {
    const { lang } = req.params;
    let key = Object.keys(req.body);
    if (key.length !== 1) return res.status(400).send({ error: "body error" });
    key = head(key);

    const language = await LanguageKeysModel.findOne({ name: key });

    if (language) return res.send({ message: "this key already added" });

    const newKey = new LanguageKeysModel({ name: key });

    const languageCodes = await LanguageCodeModel.find();

    for (const code of languageCodes) {
      const newValue = new LanguageValuesModel({ value: null, keyId: get(newKey, "_id", "").toString(), languageCode: code.code });
      await newValue.save();
    }

    await newKey.save();
    await formatAndGetLanguageByLang(lang);
    res.send({ message: "success" });
  } catch (e) {
    errorHandling(e, setKeyLanguage.name, res, fileName);
  }
};

const setValueLanguage = async (req, res) => {
  try {
    const { code, keyId, value, id } = req.body;
    if (!code || !keyId) return res.status(400).send({ error: "code, keyId, value are required" });
    const language = await LanguageCodeModel.findOne({ code });
    if (!language) return res.status(404).send({ error: "Language not found" });

    const getOneValue = await LanguageValuesModel.findOne({ _id: id, code, keyId });
    if (!getOneValue) return res.status(404).send({ error: "value not found" });
    getOneValue.value = value ? value : null;

    await getOneValue.save();
    await formatAndGetLanguageByLang(code);

    res.send({ message: "success" });
  } catch (e) {
    errorHandling(e, setValueLanguage.name, res, fileName);
  }
};

const getLanguageCodes = async (req, res) => {
  try {
    const codes = await LanguageCodeModel.find();
    const newCode = [];
    if (isEmpty(codes)) {
      const newCode1 = new LanguageCodeModel({ name: "uz", code: "uz" });
      const newCode2 = new LanguageCodeModel({ name: "eng", code: "eng" });
      const newCode3 = new LanguageCodeModel({ name: "ru", code: "ru" });
      await newCode1.save();
      await newCode2.save();
      await newCode3.save();
      newCode.push(newCode1, newCode2, newCode3);
    }
    res.send({ data: isEmpty(codes) ? newCode : codes });
  } catch (e) {
    errorHandling(e, getLanguageCodes.name, res, fileName);
  }
};

const getLanguageValueForEditing = async (req, res) => {
  try {
    const { lang } = req.params;

    const languageKeys = await LanguageKeysModel.find();
    const query = {
      languageCode: lang,
    };
    languageKeys.forEach((key) => {
      if (!isArray(query.$or)) query.$or = [];
      if (query.$or) query.$or.push({ keyId: key });
    });
    let languages = await LanguageValuesModel.find(query).populate("keyId");
    res.send({ data: languages });
  } catch (e) {
    errorHandling(e, getLanguageCodesForEditing.name, res, fileName);
  }
};

const searchValues = async (req, res) => {
  try {
    let { search, lang } = req.query;
    let re = new RegExp(search, "i");
    let query = {};
    if (search != undefined && search != "") {
      query = {
        languageCode: lang,
        $or: [{ value: { $regex: re } }],
      };
    }

    const languageKeys = await LanguageKeysModel.find({ $or: [{ name: { $regex: re } }] });

    languageKeys.forEach((key) => {
      if (!isArray(query.$or)) query.$or = [];
      if (query.$or) query.$or.push({ keyId: key });
    });

    const items = await LanguageValuesModel.find(query).populate("keyId");
    return res.send({ data: items });
  } catch (e) {
    errorHandling(e, searchValues.name, res, fileName);
  }
};

const getAdmins = async (req, res) => {
  try {
    const admins = await UserModel.find({ $or: [{ role: "admin" }, { role: "superadmin" }] }, { password: 0 });

    return res.send({ data: admins });
  } catch (e) {
    errorHandling(e, getAdmins.name, res, fileName);
  }
};

const getWithoutAdmins = async (req, res) => {
  try {
    const admins = await UserModel.find({ $nor: [{ role: "admin" }, { role: "superadmin" }] }, { password: 0 });

    return res.send({ data: admins });
  } catch (e) {
    errorHandling(e, getAdmins.name, res, fileName);
  }
};

const removeFeilds = ["-deleted", "-updated", "-updatedById", "-updatedAt", "-__v"];
const populateOptions = [{ path: "botUserId", select: removeFeilds }];

const increaseRating = async (req, res) => {
  try {
    const user = await UserModel.findById(get(req, "user.userId"));
    if (!user) return res.status(400).send({ error: "user not found" });
    const nowInLong = new Date().getTime();
    // const time =  30 * 1000;

    // if (nowInLong - user.numberOfAttemptsDate < time)
    //   return res.status(400).send({
    //     error: `try again after: ${((time - (nowInLong - user.numberOfAttemptsDate)) / 1000 / 60).toFixed(1)} minutes`,
    //   });

    user.numberOfAttempts++;
    user.numberOfAttemptsDate = nowInLong;

    await user.save();
    res.send({ message: "ok" });

    // const day = 1000 * 60 * 60 * 24;
    // const month = day * 30;
    const users = await UserModel.find().populate(populateOptions);
    users.forEach((u) => {
      if (u.phoneNumber !== user.phoneNumber) {
        bot.sendMessage(get(u, "botUserId.chatId"), `${get(user, "firstName")} yangi level ga ko'tarildi. Harakat qilish vaqti kelmadimi?`);
      }
    });
  } catch (e) {
    errorHandling(e, increaseRating.name, res, fileName);
  }
};

module.exports = {
  login,
  me,
  createUser,
  checkPhoneNumber,
  getSmsCode,
  forgotPassword,
  verifyPassword,
  addLanguage,
  getLanguages,
  setKeyLanguage,
  setValueLanguage,
  verifyCreatingUser,
  verifyPhoneNumber,
  verifySmsCodeForForgot,
  getLanguageCodes,
  getLanguageValueForEditing,
  searchValues,
  getAdmins,
  getWithoutAdmins,
  createAdmin,
  removeAdmin,
  increaseRating,
};
