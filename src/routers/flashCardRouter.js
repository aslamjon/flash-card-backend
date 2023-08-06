const { Router } = require("express");
const { create, getData, getOne, deleteById, updateById, getPronunciation } = require("../controllers/flashCardController");
const { checkUser } = require("../middlewares/authMiddleware");

const router = Router();

router.post("/v1", checkUser, create);
router.get("/v1", checkUser, getData);
router.get("/v1/:id", checkUser, getOne);
router.delete("/v1", checkUser, deleteById);
router.put("/v1/:id", checkUser, updateById);
router.get("/v1/pronunciation/:word", getPronunciation);

module.exports = {
  flashCardRouter: router,
};
