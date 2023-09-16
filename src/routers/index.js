const { authRouter } = require("./authRouter");
const { botRouter } = require("./botRouter");
const { flashCardRouter } = require("./flashCardRouter");
const { ratingRouter } = require("./ratingRouter");
const { tagRouter } = require("./tagRouter");
const { userDetailedByTagRouter } = require("./userDetailedByTagRouter");

module.exports = {
  userDetailedByTagRouter,
  tagRouter,
  ratingRouter,
  flashCardRouter,
  botRouter,
  authRouter,
};
