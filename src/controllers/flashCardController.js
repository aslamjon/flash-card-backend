const path = require("path");
const { isEmpty, isArray, get } = require("lodash");
const fs = require("fs");
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
  requestLogger,
  responseLogger,
} = require("../utils/utiles");
const { TagsModel } = require("../models/tagModel");
const { RatingModel } = require("../models/ratingModel");
const { downloadCambridgeAudio } = require("../services/downloadPronunciation/getCambridge");
const { downloadGoogleAudio } = require("../services/downloadPronunciation/getGoogle");

const logger = require("../utils/logger");
const { IMAGES_PATH, DATA_PATH } = require("../config");

const fileName = path.basename(__filename);

const getDataByQuery = ({ query = {}, Model = DBModle } = {}) => getDataFromModelByQuery({ Model, query });
const getOneByQuery = ({ query = {}, Model = DBModle } = {}) => getOneFromModelByQuery({ Model, query });

const keyTitle = "FlashCard";

const removeFeilds = ["-deleted", "-updated", "-updatedById", "-updatedAt", "-__v"];
const populateOptions = [{ path: "tag", select: removeFeilds }];
const types = {
  adj: true,
  adv: true,
  noun: true,
  verb: true,
  pronoun: true,
  preposition: true,
  conjunction: true,
  interjection: true,
};

const create = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, create.name);
  try {
    let { front, back, frontDescription, backDescription, tagId, type } = req.body;

    if (!front || !back) return res.status(400).send({ error: "front, back are required" });

    const tag = await getOneByQuery({ query: { _id: tagId }, Model: TagsModel });
    if (!tag) return res.status(404).send({ error: "tag is not found" });
    if (type && !types[type]) return res.status(400).send({ error: "type error" });
    const exist = await getOneByQuery({ query: { front, tag: tagId, type, createdById: get(req, "user.userId") } });
    if (exist) return res.status(400).send({ error: "This word has already been added" });

    const newData = new DBModle({
      front,
      back,
      frontDescription,
      backDescription,
      tag: tagId,
      type,
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
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, create.name, now);
  }
};

const getData = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, getData.name);
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
      if (limit > 200) return res.status(400).send({ error: "limit is invalid" });

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

    const items = await getDataByQuery({ query }).populate(populateOptions);
    const flashCardIds = items.map((i) => i._id);
    const rating = await getDataByQuery({ query: { flashCardId: { $in: flashCardIds }, userId: get(req, "user.userId") }, Model: RatingModel });
    return res.send({ data: items, rating });
  } catch (e) {
    errorHandling(e, getData.name, res, fileName);
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, getData.name, now);
  }
};

const getOne = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, getOne.name);
  try {
    let { tagId } = req.query;
    const { id } = req.params;
    const item = await getDataByQuery({ query: { _id: id, tag: tagId } }).populate(populateOptions);
    return res.send({ data: item });
  } catch (e) {
    errorHandling(e, getData.name, res, fileName);
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, getOne.name, now);
  }
};

const deleteById = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, deleteById.name);
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
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, deleteById.name, now);
  }
};

const updateById = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, updateById.name);
  try {
    const { id } = req.params;
    let { front, back, frontDescription, backDescription, type } = req.body;

    if (!id) return res.status(400).send({ error: " id are required" });

    let query = { _id: id };

    let data = await getOneByQuery({ query });

    if (isEmpty(data)) return res.status(404).send({ message: "data not found" });
    if (type && !types[type]) return res.status(400).send({ error: "type error" });

    if (data.createdById.toString() !== get(req, "user.userId")) return res.status(403).send({ error: "not allowed" });

    data.front = front || data.front;
    data.back = back || data.back;
    data.frontDescription = frontDescription || data.frontDescription;
    data.backDescription = backDescription || data.backDescription;
    data.type = type || data.type;

    data = updateFormat({ item: data, id: get(req, "user.userId") });

    await data.save();

    return res.send({ message: "updated", data });

    // return res.status(400).send({ error: "file is required" });
  } catch (e) {
    errorHandling(e, updateById.name, res, fileName);
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, updateById.name, now);
  }
};

let cambridge = {};
let google = {};

const getPronunciation = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, getPronunciation.name);
  try {
    const { word } = req.params;

    // if cache is empty, read cambridge and set it to cache
    if (isEmpty(cambridge)) {
      const res = fs.readFileSync(`${DATA_PATH}/cambridge.json`, { encoding: "ascii" });
      cambridge = JSON.parse(res);
    }

    // if there is word in cambridge cache, get this
    if (get(cambridge[word], "filePath")) {
      const filePath = path.join(DATA_PATH, get(cambridge[word], "filePath"));
      return res.sendFile(filePath);
    }

    // if google cache is empty, read it and set it to google cache
    if (isEmpty(google)) {
      const r = fs.readFileSync(`${DATA_PATH}/google.json`, { encoding: "ascii" });
      google = JSON.parse(r);
    }

    // if there is word in google cache, get it
    if (get(google[word], "filePath")) {
      const filePath = path.join(DATA_PATH, get(google[word], "filePath"));
      return res.sendFile(filePath);
    }

    // download this pronunciation by cambridge
    logger.info(`${word} request -> [getPronunciation.cambridge] -> ${req.method} ${req.originalUrl}`);

    let requestTime = new Date().getTime();
    const result = await downloadCambridgeAudio(word, `${DATA_PATH}/pronunciation/cambridge`);

    logger.info(`${word} response in ${new Date().getTime() - requestTime}ms <- [getPronunciation.cambridge]: ${JSON.stringify(result)}`);

    // if it is success, add word to cache, write to JSON file and send file
    if (result.downloaded) {
      delete result.downloaded;
      cambridge[word] = result;
      fs.writeFileSync(`${DATA_PATH}/cambridge.json`, JSON.stringify(cambridge, null, 2));
      const filePath = path.join(DATA_PATH, get(cambridge[word], "filePath"));
      return res.sendFile(filePath);
    }

    // download this pronunciation by google
    logger.info(`${word} request -> [getPronunciation.google] -> ${req.method} ${req.originalUrl}`);
    requestTime = new Date().getTime();

    const googleResult = await downloadGoogleAudio(word, `${DATA_PATH}/pronunciation/google`);
    logger.info(`${word} response in ${new Date().getTime() - requestTime}ms <- [getPronunciation.google]: ${JSON.stringify(googleResult)}`);

    if (googleResult.downloaded) {
      google[word] = googleResult;

      fs.writeFileSync(`${DATA_PATH}/google.json`, JSON.stringify(google, null, 2));

      const filePath = path.join(DATA_PATH, get(google[word], "filePath"));
      return res.sendFile(filePath);
    }

    return res.status(404).send({ error: "not found" });
  } catch (e) {
    errorHandling(e, getPronunciation.name, res, fileName);
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, getPronunciation.name, now);
  }
};

const getImage = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, getImage.name);
  try {
    const { word, type } = req.params;
    const filePath = `${IMAGES_PATH}/${type}/${word}.jpg`;

    return res.sendFile(filePath);
  } catch (e) {
    errorHandling(e, getImage.name, res, fileName);
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, getImage.name, now);
  }
};

module.exports = {
  create,
  getData,
  getOne,
  deleteById,
  updateById,
  getPronunciation,
  getImage,
};
