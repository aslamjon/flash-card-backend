const { Schema, model, Types } = require("mongoose");

const schema = new Schema({
  flashCardId: {
    type: Types.ObjectId,
    ref: "FlashCard",
    required: true,
  },
  userId: {
    type: Types.ObjectId,
    ref: "Users",
    required: true,
  },
  rating: {
    type: Number,
    default: 1,
  },
  level: {
    type: Number,
    default: 1,
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
  RatingModel: model("Rating", schema),
};
