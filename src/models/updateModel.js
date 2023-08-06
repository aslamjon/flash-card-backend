const { Schema, model, Types } = require("mongoose");

const updateSchema = new Schema({
  oldValue: {
    type: String,
  },
  newValue: {
    type: String,
  },
  controllerName: {
    type: String,
  },
  valueId: {
    type: Types.ObjectId,
  },
  createdById: {
    type: Types.ObjectId,
    required: true,
    ref: "Users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  UpdateModel: model("Update", updateSchema),
};
