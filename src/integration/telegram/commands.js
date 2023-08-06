const { contactOptions } = require("./keyboards");

const startCommand = async (bot, msg) => {
  const chatId = msg.chat.id;

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

module.exports = {
  startCommand,
  infoCommand,
};
