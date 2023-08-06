const { Schema, model, Types } = require("mongoose");

const keysSchema = new Schema({
  name: String,
});

const valuesSchema = new Schema({
  value: {
    type: String,
    default: null,
  },
  keyId: {
    type: Types.ObjectId,
    required: true,
    ref: "Language-keys",
  },
  languageCode: {
    type: String,
    required: true,
  },
});

const codeSchema = new Schema({
  code: String,
  name: String,
  disabled: {
    type: Boolean,
    default: false,
  },
});

module.exports = {
  LanguageCodeModel: model("Language-code", codeSchema),
  LanguageKeysModel: model("Language-keys", keysSchema),
  LanguageValuesModel: model("Language-values", valuesSchema),
};
