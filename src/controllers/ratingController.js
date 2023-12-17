const path = require("path");
const { isEmpty, isArray, get } = require("lodash");
const { RatingModel: DBModle } = require("../models/ratingModel");
const {
  deleteFormat,
  errorHandling,
  getOneFromModelByQuery,
  getDataFromModelByQuery,
  updateFormat,
  hideFields,
  saveImgs,
  unlink,
  feildRemover,
  responseLogger,
  requestLogger,
} = require("../utils/utiles");
const { TagsModel } = require("../models/tagModel");
const { FlashCardModel } = require("../models/flashCardModel");
const { UserDetailedByTagModel } = require("../models/userDetailedByTagModel");

const fileName = path.basename(__filename);

const getDataByQuery = ({ query = {}, Model = DBModle } = {}) => getDataFromModelByQuery({ Model, query });
const getOneByQuery = ({ query = {}, Model = DBModle } = {}) => getOneFromModelByQuery({ Model, query });

const keyTitle = "Rating";

const removeFeilds = ["-deleted", "-updated", "-updatedById", "-updatedAt", "-__v"];
const populateOptions = [{ path: "tag", select: removeFeilds }];

const updateById = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, updateById.name);
  try {
    const { flashCardId } = req.params;
    let { answer, tagId } = req.query;

    if (!flashCardId) return res.status(400).send({ error: "flashCardId is required" });
    if (!answer) return res.status(400).send({ error: "answer is required" });
    if (answer !== "correct" && answer !== "incorrect") return res.status(400).send({ error: "answer is not valid" });
    if (!tagId) return res.status(400).send({ error: "tagId is required" });

    let query = { _id: flashCardId };

    let exictFlashCard = await getOneByQuery({ query, Model: FlashCardModel });
    if (isEmpty(exictFlashCard)) return res.status(404).send({ error: "flash-card is not found" });

    let data = await getOneByQuery({ query: { flashCardId, userId: get(req, "user.userId") } });

    const getUserDetailedByTag = await getOneByQuery({
      query: {
        tagId,
        userId: get(req, "user.userId"),
      },
      Model: UserDetailedByTagModel,
    });

    const ratingInterval = 3;

    if (isEmpty(data)) {
      const newRating = new DBModle({
        flashCardId,
        userId: get(req, "user.userId"),
        ...(answer === "correct"
          ? {
              rating: get(getUserDetailedByTag, "numberOfAttempts", 0) + 1 + ratingInterval,
              level: 1,
            }
          : answer === "incorrect"
          ? {
              rating: get(getUserDetailedByTag, "numberOfAttempts", 0),
              level: 0,
            }
          : {}),
        repeat: 1,
        createdById: get(req, "user.userId"),
      });
      await newRating.save();
      return res.send({ message: "success" });
    }

    if (answer === "correct") {
      data.level++;
      data.rating += data.level * ratingInterval;
    } else if (answer === "incorrect") {
      data.level--;
      data.rating -= data.level * ratingInterval;
    }
    data.repeat++;

    data = updateFormat({ item: data, id: get(req, "user.userId") });

    await data.save();

    return res.send({ message: "updated" });

    // return res.status(400).send({ error: "file is required" });
  } catch (e) {
    errorHandling(e, updateById.name, res, fileName);
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, updateById.name, now);
  }
};

module.exports = {
  updateById,
};
