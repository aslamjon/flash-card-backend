const contactOptions = {
  parse_mode: "Markdown",
  reply_markup: {
    one_time_keyboard: true,
    resize_keyboard: true,
    keyboard: [
      [
        {
          text: "My phone number",
          request_contact: true,
        },
      ],
    ],
  },
};

const locationOption = {
  parse_mode: "Markdown",
  reply_markup: {
    one_time_keyboard: true,
    resize_keyboard: true,
    keyboard: [
      [
        {
          text: "My location",
          request_location: true,
        },
      ],
    ],
  },
};

const startOpitons = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "Start", callback_data: "/start" }]],
  }),
};

const homeOptions = (chatId) => ({
  reply_markup: JSON.stringify({
    keyboard: [
      [{ text: "📚 Learn now", web_app: { url: `https://card.aslamjon.uz?chatId=${chatId}&timestamp=${Date.now()}` } }],
      // [{ text: "📚 Learn now", web_app: { url: `https://191f-195-158-9-110.ngrok-free.app?chatId=${chatId}&timestamp=${Date.now()}` } }],
      [{ text: "📊 Statistics" }, { text: "📈 Rating" }],
    ],
    resize_keyboard: true,
  }),
});

const removeAllOptions = {
  reply_markup: {
    remove_keyboard: true,
  },
};

module.exports = { contactOptions, locationOption, homeOptions, removeAllOptions, startOpitons };
