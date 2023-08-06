const path = require("path");
const { isEmpty, isArray, get } = require("lodash");
const { FlashCardModel: DBModle } = require("../models/flashCardModel");
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
} = require("../utils/utiles");
const { TagsModel } = require("../models/tagModel");
const { RatingModel } = require("../models/ratingModel");
const fs = require("fs");
const { downloadCambridgeAudio } = require("../services/downloadPronunciation/getCambridge");
const { downloadGoogleAudio } = require("../services/downloadPronunciation/getGoogle");

const words = require("../../data/cambridge.json");
const logger = require("../utils/logger");

const fileName = path.basename(__filename);

const getDataByQuery = ({ query = {}, Model = DBModle } = {}) => getDataFromModelByQuery({ Model, query });
const getOneByQuery = ({ query = {}, Model = DBModle } = {}) => getOneFromModelByQuery({ Model, query });

const keyTitle = "FlashCard";

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
    let { skip, limit, tagId, type = "global" } = req.query;
    const { ids } = req.body;
    if (!tagId) return res.status(400).send({ error: "tagId is required" });
    let query = { tag: tagId };
    if (ids) query = { ...query, _id: { $in: ids } };
    if (type !== "self" && type !== "global") return res.status(400).send({ error: "type is invalid" });

    if (type === "self") query.createdById = get(req, "user.userId");

    let result = {};

    if (skip && limit) {
      skip = Number(skip);
      limit = Number(limit);
      if (skip <= limit) {
        [result.items, result.count] = await Promise.all([
          getDataByQuery({ query }).skip(skip).limit(limit).populate(populateOptions),
          DBModle.countDocuments({ ...query, deleted: { $eq: false } }),
        ]);
        const flashCardIds = result.items.map((i) => i._id);
        const rating = await getDataByQuery({ query: { flashCardId: { $in: flashCardIds }, userId: get(req, "user.userId") }, Model: RatingModel });

        return res.send({
          data: result.items,
          rating,
          count: result.count,
        });
      }
    }

    const items = await getDataByQuery({ query }).populate(populateOptions);
    const flashCardIds = items.map((i) => i._id);
    const rating = await getDataByQuery({ query: { flashCardId: { $in: flashCardIds }, userId: get(req, "user.userId") }, Model: RatingModel });
    return res.send({ data: items, rating });
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
  try {
    const { id } = req.params;
    let { front, back, frontDescription, backDescription } = req.body;

    if (!id) return res.status(400).send({ error: " id are required" });

    let query = { _id: id };

    let data = await getOneByQuery({ query });

    if (isEmpty(data)) return res.status(404).send({ message: "data not found" });

    data.front = front || data.front;
    data.back = back || data.back;
    data.frontDescription = frontDescription || data.frontDescription;
    data.backDescription = backDescription || data.backDescription;

    data = updateFormat({ item: data, id: get(req, "user.userId") });

    await data.save();

    return res.send({ message: "updated", data });

    // return res.status(400).send({ error: "file is required" });
  } catch (e) {
    errorHandling(e, updateById.name, res, fileName);
  }
};

let cambridge = {};
let google = {};

const getPronunciation = async (req, res) => {
  try {
    const { word } = req.params;
    // if cache is empty, read cambridge and set it to cache
    if (isEmpty(cambridge)) {
      const res = fs.readFileSync("data/cambridge.json", { encoding: "ascii" });
      cambridge = JSON.parse(res);
    }

    // if there is word in cambridge cache, get this
    if (get(cambridge[word], "filePath")) {
      const filePath = path.join(__dirname, `../../${get(cambridge[word], "filePath")}`);
      return res.sendFile(filePath);
    }

    // if google cache is empty, read it and set it to google cache
    if (isEmpty(google)) {
      const r = fs.readFileSync("data/google.json", { encoding: "ascii" });
      google = JSON.parse(r);
    }

    // if there is word in google cache, get it
    if (get(google[word], "filePath")) {
      const filePath = path.join(__dirname, `../../${get(google[word], "filePath")}`);
      return res.sendFile(filePath);
    }

    // download this pronunciation by cambridge
    logger.info(`${word} request -> [getPronunciation.cambridge] -> ${req.method} ${req.originalUrl}`);
    let requestTime = new Date().getTime();
    const result = await downloadCambridgeAudio(word, "data/pronunciation/cambridge");
    logger.info(`${word} response in ${new Date().getTime() - requestTime}ms <- [getPronunciation.cambridge]: ${JSON.stringify(result)}`);

    // if it is success, add word to cache, write to JSON file and send file
    if (result.status === 200) {
      cambridge[word] = result;
      fs.writeFileSync("data/cambridge.json", JSON.stringify(cambridge, null, 2));
      const filePath = path.join(__dirname, `../../${get(cambridge[word], "filePath")}`);
      return res.sendFile(filePath);
    }

    // download this pronunciation by google
    logger.info(`${word} request -> [getPronunciation.google] -> ${req.method} ${req.originalUrl}`);
    requestTime = new Date().getTime();

    const googleResult = await downloadGoogleAudio(word, "data/pronunciation/google");
    logger.info(`${word} response in ${new Date().getTime() - requestTime}ms <- [getPronunciation.google]: ${JSON.stringify(googleResult)}`);

    if (googleResult.status === 200) {
      google[word] = googleResult;

      fs.writeFileSync("data/google.json", JSON.stringify(google, null, 2));

      const filePath = path.join(__dirname, `../../${get(google[word], "filePath")}`);
      return res.sendFile(filePath);
    }

    return res.status(404).send({ error: "not found" });
  } catch (e) {
    errorHandling(e, getPronunciation.name, res, fileName);
  }
};
// Object.keys(words).forEach((key) => {
//   words[key].filePath = `data/pronunciation/cambridge/${words[key].fileName}`;
// });
// console.log(words);
// fs.writeFileSync("data/cambridge.json", JSON.stringify(words, null, 2));

module.exports = {
  create,
  getData,
  getOne,
  deleteById,
  updateById,
  getPronunciation,
};
