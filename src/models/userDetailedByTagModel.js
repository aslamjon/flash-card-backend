const { Schema, model, Types } = require("mongoose");

const schema = new Schema({
  tagId: {
    type: Types.ObjectId,
    ref: "Tags",
    required: true,
  },
  userId: {
    type: Types.ObjectId,
    ref: "Users",
    required: true,
  },
  numberOfAttempts: {
    type: Number,
    default: 0,
  },
  numberOfAttemptsDate: {
    type: Number,
    default: 0,
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
  UserDetailedByTagModel: model("UserDetailedByTag", schema),
};
