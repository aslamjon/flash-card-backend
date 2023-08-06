const { Router } = require("express");
const { create, getData, getOne, deleteById, updateById } = require("../controllers/ratingController");
const { checkUser } = require("../middlewares/authMiddleware");

const router = Router();

// router.post("/v1", checkUser, create);
// router.get("/v1", checkUser, getData);
// router.get("/v1/:id", checkUser, getOne);
// router.delete("/v1", checkUser, deleteById);
router.put("/v1/:flashCardId", updateById);

module.exports = {
  ratingRouter: router,
};
