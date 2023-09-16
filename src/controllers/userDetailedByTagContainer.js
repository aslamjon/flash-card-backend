const path = require("path");
const { UserDetailedByTagModel: DBModle } = require("../models/userDetailedByTagModel");
const { errorHandling, getDataFromModelByQuery, responseLogger, requestLogger } = require("../utils/utiles");
const { get } = require("lodash");

const fileName = path.basename(__filename);

const getDataByQuery = ({ query = {}, Model = DBModle } = {}) => getDataFromModelByQuery({ Model, query });
// const getOneByQuery = ({ query = {}, Model = DBModle } = {}) => getOneFromModelByQuery({ Model, query });

const getData = async (req, res) => {
  const now = requestLogger(get(req, "user.firstName"), fileName, getData.name);
  try {
    let { skip, limit } = req.query;
    let query = { userId: get(req, "user.userId") };

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
  } finally {
    responseLogger(get(req, "user.firstName"), fileName, getData.name, now);
  }
};

module.exports = {
  getData,
};
