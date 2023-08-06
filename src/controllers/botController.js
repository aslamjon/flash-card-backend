const { BotUserModel } = require("../models/botUserModel");
const { bot } = require("../integration/telegram/index");
const { errorHandling } = require("../utils/utiles");

const fileName = require("path").basename(__filename);

const getUsersOfBot = async (req, res) => {
  try {
    const users = await BotUserModel.find();
    return res.send({ data: users });
  } catch (e) {
    errorHandling(e, getUsersOfBot.name, res, fileName);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { comment, chatId } = req.body;
    if (!comment || !chatId) return res.status(400).send({ error: "Invalid reply" });

    bot.sendMessage(chatId, comment);
    return res.status(200).send({ message: "success" });
  } catch (e) {
    errorHandling(e, sendMessage.name, res, fileName);
  }
};

const search = async (req, res) => {
  try {
    let { search } = req.query;
    let re = new RegExp(search, "i");
    let query = {};
    if (search != undefined && search != "") {
      query = {
        $or: [{ fullName: { $regex: re } }, { phoneNumber: { $regex: re } }],
      };
    }

    const items = await BotUserModel.find(query);
    return res.send({ data: items });
  } catch (e) {
    errorHandling(e, search.name, res, fileName);
  }
};

module.exports = {
  getUsersOfBot,
  search,
  sendMessage,
};
