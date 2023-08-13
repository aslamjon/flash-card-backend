const { get } = require("lodash");
const { BotUserModel } = require("../../models/botUserModel");
const { UserModel } = require("../../models/userModel");
const { contactOptions, removeAllOptions } = require("./keyboards");

const startCommand = async (bot, msg) => {
  const chatId = msg.chat.id;

  const botUser = await BotUserModel.findOne({ chatId });
  if (botUser)
    return bot.sendMessage(
      chatId,
      `Assalomu aleykum ${msg.from.first_name} botiga xush kelibsiz.
  `,
      removeAllOptions
    );

  return bot.sendMessage(
    chatId,
    `Assalomu aleykum ${msg.from.first_name} botiga xush kelibsiz.
  `,
    contactOptions
  );
};

const infoCommand = async (bot, msg) => {
  return bot.sendMessage(chatId, `sizning ismingiz ${msg.from.first_name}`);
};

const ratingCommand = async (bot, msg) => {
  const chatId = msg.chat.id;
  const botUser = await BotUserModel.findOne({ chatId });
  if (!botUser) return bot.sendMessage(chatId, "data not found");

  const user = await UserModel.findOne({ phoneNumber: get(botUser, "phoneNumber") });

  const sortField = "numberOfAttempts";
  const sortOrder = -1; // -1 for descending, 1 for ascending

  const users = await UserModel.find()
    .sort({ [sortField]: sortOrder })
    .limit(10);

  let message = `🎯 Your rating: ${user.numberOfAttempts}\n\n`;

  users.forEach((user, index) => {
    message += `${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖"} ${user.firstName}: ${user.numberOfAttempts}\n`;
  });
  bot.sendMessage(chatId, message);
};

module.exports = {
  startCommand,
  infoCommand,
  ratingCommand,
};
