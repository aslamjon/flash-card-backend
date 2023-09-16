const { Router } = require("express");
const { getData } = require("../controllers/userDetailedByTagContainer");

const router = Router();

router.get("/v1", getData);

module.exports = {
  userDetailedByTagRouter: router,
};
