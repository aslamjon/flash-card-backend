const { Router } = require("express");
const { getUsersOfBot, search, sendMessage } = require("../controllers/botController");

const { checkUser } = require("../middlewares/authMiddleware");

const router = Router();

router.get("/v1/users-of-bot", getUsersOfBot);
router.get("/v1/search", search);
router.post("/v1/send-message", sendMessage);

module.exports = {
  botRouter: router,
};
