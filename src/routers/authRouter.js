const { Router } = require("express");

const {
  login,
  me,
  createUser,
  checkPhoneNumber,
  getSmsCode,
  forgotPassword,
  verifyPassword,
  addLanguage,
  getLanguages,
  setValueLanguage,
  verifyCreatingUser,
  verifyPhoneNumber,
  verifySmsCodeForForgot,
  setKeyLanguage,
  getLanguageCodes,
  getLanguageValueForEditing,
  searchValues,
  getAdmins,
  getWithoutAdmins,
  createAdmin,
  removeAdmin,
  increaseRating,
} = require("../controllers/authController");
const { checkUser } = require("../middlewares/authMiddleware");
const { isSuperAdmin } = require("../middlewares/checkPermission");

const router = Router();

router.post("/v1/auth/sign-in", login);
router.get("/v1/auth/me", checkUser, me);
router.post("/v1/auth/sign-up", createUser);
router.post("/v1/auth/check-phone", checkPhoneNumber);
router.post("/v1/auth/get-sms-code", getSmsCode);
router.post("/v1/auth/forgot-password", forgotPassword);
router.post("/v1/auth/verify-phone-number", verifyPhoneNumber);
router.post("/v1/auth/verify-forgot-sms-code", verifySmsCodeForForgot);
router.post("/v1/auth/verify-password", verifyPassword);
router.post("/v1/auth/verify-creating-user", verifyCreatingUser);
router.post("/v1/auth/create-user", checkUser, isSuperAdmin, createAdmin);
router.delete("/v1/auth/remove-admin/:id", checkUser, isSuperAdmin, removeAdmin);

router.post("/v1/language/add-language", checkUser, addLanguage);
router.get("/v1/language/languages/:lang", getLanguages);
router.get("/v1/language/get-languages/:lang", getLanguageValueForEditing);
router.post("/v1/language/set-key/:lang", setKeyLanguage);
router.post("/v1/language/set-value", setValueLanguage);
router.get("/v1/language/codes", getLanguageCodes);
router.get("/v1/language/search", searchValues);
router.get("/v1/admins", getAdmins);
router.get("/v1/user-without-admin", getWithoutAdmins);

router.get("/v1/play", checkUser, increaseRating);

module.exports = {
  authRouter: router,
};
