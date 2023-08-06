const path = require("path");
const { isEmpty, isArray, get } = require("lodash");
const { TagsModel: DBModle } = require("../models/tagModel");
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

const fileName = path.basename(__filename);

const getDataByQuery = ({ query = {}, Model = DBModle } = {}) => getDataFromModelByQuery({ Model, query });
const getOneByQuery = ({ query = {}, Model = DBModle } = {}) => getOneFromModelByQuery({ Model, query });

const keyTitle = "tag";

const removeFeilds = ["-deleted", "-updated", "-updatedById", "-updatedAt", "-__v"];
const populateOptions = [{ path: "tag", select: removeFeilds }];

const create = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name) return res.status(400).send({ error: "name is required" });

    const newData = new DBModle({
      name,
      createdById: get(req, "user.userId"),
    });

    await newData.save();
    return res.status(200).send({
      message: `${keyTitle} created`,
      data: newData,
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
          getDataByQuery({ query }).skip(skip).limit(limit),
          DBModle.countDocuments({ ...query, deleted: { $eq: false } }),
        ]);

        return res.send({ data: result.items, count: result.count });
      }
    }

    const items = await getDataByQuery({ query });
    return res.send({ data: items });
  } catch (e) {
    errorHandling(e, getData.name, res, fileName);
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getDataByQuery({ query: { _id: id } });
    return res.send({ data: item });
  } catch (e) {
    errorHandling(e, getData.name, res, fileName);
  }
};

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    let query = { _id: id };

    if (!id) return res.status(400).send({ error: "id is required " });
    const data = await getOneByQuery({ query });
    if (!data) res.status(404).send({ error: `${keyTitle} is not found` });
    else {
      await deleteFormat({ item: data, id: req.user.userId }).save();
      res.send({ message: `${keyTitle} has been deleted` });
    }
  } catch (e) {
    errorHandling(e, deleteById.name, res, fileName);
  }
};

const updateById = async (req, res) => {
  try {
    const { id } = req.params;
    let { name } = req.body;

    if (!id) return res.status(400).send({ error: " id are required" });

    let query = { _id: id };

    let data = await getOneByQuery({ query });

    if (isEmpty(data)) return res.status(404).send({ message: "data not found" });

    data.name = name || data.name;
    data = updateFormat({ item: data, id: get(req, "user.userId") });

    await data.save();

    return res.send({ message: "updated", data });

    // return res.status(400).send({ error: "file is required" });
  } catch (e) {
    errorHandling(e, updateById.name, res, fileName);
  }
};

module.exports = {
  create,
  getData,
  getOne,
  deleteById,
  updateById,
};
