const { Router } = require("express");
const { create, getData, getOne, deleteById, updateById } = require("../controllers/tagController");

const router = Router();

router.post("/v1", create);
router.get("/v1", getData);
router.get("/v1/:id", getOne);
router.delete("/v1/:id", deleteById);
router.put("/v1/:id", updateById);

module.exports = {
  tagRouter: router,
};
