const { get } = require("lodash");
const moment = require("moment");
const { BotUserModel } = require("../../models/botUserModel");
const { UserModel } = require("../../models/userModel");
const { FlashCardModel } = require("../../models/flashCardModel");
const { contactOptions, homeOptions } = require("./keyboards");
const config = require("../../config");
const { errorHandlerBot, requestLogger, responseLogger } = require("../../utils/utiles");
const { UserDetailedByTagModel } = require("../../models/userDetailedByTagModel");

const fileName = require("path").basename(__filename);

const startCommand = async (bot, msg) => {
  const chatId = msg.chat.id;

  const botUser = await BotUserModel.findOne({ chatId });
  if (botUser)
    return bot.sendMessage(
      chatId,
      `Assalomu aleykum ${msg.from.first_name} botga xush kelibsiz.
  `,
      homeOptions(chatId)
    );

  return bot.sendMessage(
    chatId,
    `Assalomu aleykum ${msg.from.first_name} botga xush kelibsiz.
  `,
    contactOptions
  );
};

const infoCommand = async (bot, msg) => {
  return bot.sendMessage(chatId, `sizning ismingiz ${msg.from.first_name}`);
};

const ratingCommand = async (bot, msg) => {
  const chatId = msg.chat.id;
  const now = requestLogger(chatId, fileName, ratingCommand.name);
  try {
    const botUser = await BotUserModel.findOne({ chatId });
    if (!botUser) return bot.sendMessage(chatId, "data not found");

    const user = await UserModel.findOne({ phoneNumber: get(botUser, "phoneNumber") });

    const userDetailedByTag = await UserDetailedByTagModel.find().populate(["userId"]);

    const groupOfUserDetailed = {};
    userDetailedByTag.forEach((item) => {
      if (!groupOfUserDetailed[get(item, "userId._id")]) {
        groupOfUserDetailed[item.userId._id] = { ...get(item.userId, "_doc", {}), numberOfAttempts: 0 };
      }
      groupOfUserDetailed[get(item, "userId._id")].numberOfAttempts += item.numberOfAttempts;
    });
    const arrOfUserDetailed = Object.values(groupOfUserDetailed);
    arrOfUserDetailed.sort((a, b) => b.numberOfAttempts - a.numberOfAttempts);
    if (arrOfUserDetailed.length > 10) arrOfUserDetailed = arrOfUserDetailed.slice(0, 10);

    const flashcardGroupingByCreatedById = await FlashCardModel.aggregate([
      {
        $group: {
          _id: "$createdById",
          count: { $sum: 1 },
        },
      },
    ]);

    const resultObject = {};

    flashcardGroupingByCreatedById.forEach((item) => {
      resultObject[item._id] = item.count;
    });

    let message = `🎯 Your rating: ${get(groupOfUserDetailed, `${get(user, "_id")}.numberOfAttempts`) ?? 0}\n\n`;

    let longerName = 0;
    arrOfUserDetailed.forEach((user, index) => {
      const nameAndRating = `${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖"} ${user.firstName}: ${user.numberOfAttempts};`;
      if (nameAndRating.length > longerName) longerName = nameAndRating.length;
    });

    arrOfUserDetailed.forEach((user, index) => {
      const nameAndRating = `${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖"} ${user.firstName}: ${
        user.numberOfAttempts
      };`.padEnd(longerName + 2);
      message += `${nameAndRating} ${get(resultObject, user._id) ? `\n\t\t\t\t${get(resultObject, user._id)} - ta so'z qo'shgan` : ""}\n`;
    });

    bot.sendMessage(chatId, message, homeOptions(chatId));
  } catch (e) {
    errorHandlerBot(e, ratingCommand.name, fileName, msg);
  } finally {
    responseLogger(chatId, fileName, ratingCommand.name, now);
  }
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

    const lastMonthUsers = await UserModel.find({ createdAt: { $gt: lastMonthMaxDate } });

    // 🔜 Oxirgi 24 soatda: 7  obunachi qo'shildi
    // 💰Reklama: 👉 t.me/techno_ads/104
    // 📆 Bot ishga tushganiga: 843  kun bo'ldi
    message += `🧑🏻‍💻 Botdagi obunachilar: ${users.length} ta\n\n`;
    message += `🔝 Oxirgi 1 oyda — ${lastMonthUsers.length} ta obunachi qo'shildi\n\n`;
    message += `📊 ${config.TELEGRAM_BOT_USERNAME} statistikasi`;

    bot.sendMessage(chatId, message, homeOptions(chatId));
  } catch (e) {
    errorHandlerBot(e, statisticsCommand.name, fileName, msg);
  }
};

const showAdsToEveryUsers = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;
    const botUser = await BotUserModel.findOne({ chatId });
    if (!botUser) return bot.sendMessage(chatId, "data not found");
    if (!botUser.isAdmin) return bot.sendMessage(chatId, "you are not allowed");

    // console.log(msg.text);
    // console.log(msg);
    if (msg.photo) {
      const photo = msg.photo.pop();
      let caption = msg.caption || "";
      if (caption.startsWith("/ads")) caption = caption.substr(4);

      const botUsers = await BotUserModel.find();

      botUsers.forEach((user) => {
        if (user._id.toString() !== botUser._id.toString()) bot.sendPhoto(user.chatId, photo.file_id, { caption });
      });
    } else if (msg.document) {
      let caption = msg.caption || "";
      if (caption.startsWith("/ads")) caption = caption.substr(4);
      const botUsers = await BotUserModel.find();

      botUsers.forEach((user) => {
        if (user._id.toString() !== botUser._id.toString()) bot.sendDocument(user.chatId, msg.document.file_id, { caption });
      });
    } else if (msg.text) {
      let text = msg.text || "";
      if (text.startsWith("/ads")) text = text.substr(4);
      const botUsers = await BotUserModel.find();

      botUsers.forEach((user) => {
        if (user._id.toString() !== botUser._id.toString()) bot.sendMessage(user.chatId, text);
      });
    }
  } catch (e) {
    errorHandlerBot(e, showAdsToEveryUsers.name, fileName, msg);
  }
};

module.exports = {
  startCommand,
  infoCommand,
  ratingCommand,
  statisticsCommand,
  showAdsToEveryUsers,
};
