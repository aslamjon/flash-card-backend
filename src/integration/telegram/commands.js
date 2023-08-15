const { get } = require("lodash");
const moment = require("moment");
const { BotUserModel } = require("../../models/botUserModel");
const { UserModel } = require("../../models/userModel");
const { FlashCardModel } = require("../../models/flashCardModel");
const { contactOptions, homeOptions } = require("./keyboards");
const config = require("../../config");

const startCommand = async (bot, msg) => {
  const chatId = msg.chat.id;

  const botUser = await BotUserModel.findOne({ chatId });
  if (botUser)
    return bot.sendMessage(
      chatId,
      `Assalomu aleykum ${msg.from.first_name} botiga xush kelibsiz.
  `,
      homeOptions
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
  bot.sendMessage(chatId, message, homeOptions);
};

const statisticsCommand = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;
    const botUser = await BotUserModel.findOne({ chatId });
    if (!botUser) return bot.sendMessage(chatId, "data not found");

    const users = await UserModel.find();

    const flashCards = await FlashCardModel.aggregate([
      {
        $group: {
          _id: "$tag",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "tags",
          localField: "_id",
          foreignField: "_id",
          as: "tag",
        },
      },
      {
        $addFields: {
          tag: { $arrayElemAt: ["$tag", 0] }, // Convert authorData array to a single object
        },
      },
    ]);

    let message = `📔 So'zlarning tag bo'yicha statistikasi:\n\n`;

    flashCards.forEach((flashcard) => {
      message += `✍ ${get(flashcard, "tag.name")}: ${get(flashcard, "count")} ta so'z qo'shilgan\n\n`;
    });

    const currentDate = moment();
    const lastMonthMaxDate = currentDate.clone().subtract(1, "month").endOf("month").toDate();

    const lastMonthUsers = await UserModel.find({ $gt: { createdAt: lastMonthMaxDate } });

    // 🔜 Oxirgi 24 soatda: 7  obunachi qo'shildi
    // 💰Reklama: 👉 t.me/techno_ads/104
    // 📆 Bot ishga tushganiga: 843  kun bo'ldi
    message += `🧑🏻‍💻 Botdagi obunachilar: ${users.length} ta\n\n`;
    message += `🔝 Oxirgi 1 oyda — ${lastMonthUsers.length} ta obunachi qo'shildi\n\n`;
    message += `📊 ${config.TELEGRAM_BOT_USERNAME} statistikasi`;

    bot.sendMessage(chatId, message, homeOptions);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  startCommand,
  infoCommand,
  ratingCommand,
  statisticsCommand,
};
