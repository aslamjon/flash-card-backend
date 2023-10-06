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

const create = async (req, res) => {
  try {
    let { front, back, frontDescription, backDescription, tagId } = req.body;

    if (!front || !back) return res.status(400).send({ error: "front, back are required" });

    const tag = await getOneByQuery({ query: { _id: tagId }, Model: TagsModel });
    if (!tag) return res.status(404).send({ error: "tag is not found" });

    const newData = new DBModle({
      front,
      back,
      frontDescription,
      backDescription,
      tag: tagId,
      createdById: get(req, "user.userId"),
    });

    await newData.save();
    return res.status(200).send({
      message: `${keyTitle} created`,
      // data: newData,
      data: feildRemover(await newData.populate(populateOptions)),
    });
  } catch (e) {
    errorHandling(e, create.name, res, fileName);
  }
};

const getData = async (req, res) => {
  try {
    let { skip, limit } = req.query;
    const { ids } = req.body;

    let query = {};
    if (ids) query = { ...query, _id: { $in: ids } };

    let result = {};

    if (skip && limit) {
      skip = Number(skip);
      limit = Number(limit);
      if (skip <= limit) {
        [result.items, result.count] = await Promise.all([
          getDataByQuery({ query }).skip(skip).limit(limit).populate(populateOptions),
          DBModle.countDocuments({ ...query, deleted: { $eq: false } }),
        ]);

        return res.send({ data: result.items, count: result.count });
      }
    }
    const items = await getDataByQuery({ query }).populate(populateOptions);
    return res.send({ data: items });
  } catch (e) {
    errorHandling(e, getData.name, res, fileName);
  }
};

const getOne = async (req, res) => {
  try {
    let { tagId } = req.query;
    const { id } = req.params;
    const item = await getDataByQuery({ query: { _id: id, tag: tagId } }).populate(populateOptions);
    return res.send({ data: item });
  } catch (e) {
    errorHandling(e, getData.name, res, fileName);
  }
};

const deleteById = async (req, res) => {
  try {
    if (!isArray(req.body)) return res.status(400).send({ error: "invaild data" });

    const data = await getDataByQuery({ query: { _id: { $in: req.body } } });
    if (req.body.length !== data.length) return res.status(404).send({ error: "ids are not found" });

    data.forEach(async (item) => {
      await deleteFormat({ item, id: req.user.userId }).save();
    });
    res.send({ message: `${keyTitle} has been deleted` });
    // const { id } = req.params;
    // let query = { _id: id };

    // if (!id) return res.status(400).send({ error: "id is required " });
    // const data = await getOneByQuery({ query });
    // if (!data) res.status(404).send({ error: `${keyTitle} is not found` });
    // else {
    //   await deleteFormat({ item: data, id: req.user.userId }).save();
    //   res.send({ message: `${keyTitle} has been deleted` });
    // }
  } catch (e) {
    errorHandling(e, deleteById.name, res, fileName);
  }
};

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
  create,
  getData,
  getOne,
  deleteById,
  updateById,
};
