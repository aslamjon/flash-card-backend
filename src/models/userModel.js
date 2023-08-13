const { Schema, model, Types } = require("mongoose");

const schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    default: "",
  },
  lastName: {
    type: String,
    default: "",
  },
  numberOfAttempts: {
    type: Number,
    default: 0,
  },
  numberOfAttemptsDate: {
    type: Number,
    default: 0,
  },
  botUserId: {
    type: Types.ObjectId,
    ref: "BotUser",
  },
  role: {
    type: String,
    required: true,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
  },
  updatedById: {
    type: Types.ObjectId,
    ref: "Users",
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deleteAt: {
    type: Date,
  },
  deletedById: {
    type: Types.ObjectId,
    ref: "Users",
  },
});

module.exports = {
  UserModel: model("Users", schema),
};
