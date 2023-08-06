const { Schema, model, Types } = require("mongoose");

const schema = new Schema({
  front: {
    type: String,
    required: true,
  },
  back: {
    type: String,
    required: true,
  },
  frontDescription: {
    type: String,
  },
  backDescription: {
    type: String,
  },
  tag: {
    type: Types.ObjectId,
    ref: "Tags",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdById: {
    type: Types.ObjectId,
    required: true,
    ref: "Users",
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
  FlashCardModel: model("FlashCard", schema),
};
