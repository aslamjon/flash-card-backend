const { Schema, model } = require("mongoose");

const schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  isChecked: {
    type: Boolean,
    default: false,
  },
  smsCode: {
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
  SmsCodeModel: model("SmsCode", schema),
};
