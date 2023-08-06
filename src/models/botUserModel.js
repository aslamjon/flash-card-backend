const { Schema, model } = require("mongoose");

const schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  chatId: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
  },
  fullName: {
    type: String,
  },
  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
});

module.exports = {
  BotUserModel: model("BotUser", schema),
};
