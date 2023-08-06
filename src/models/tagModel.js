const { Schema, model, Types } = require("mongoose");

const schema = new Schema({
  name: {
    type: String,
    required: true,
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
  TagsModel: model("Tags", schema),
};
