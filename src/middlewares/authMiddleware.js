const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { get, isEmpty } = require("lodash");
const { UserModel } = require("../models/userModel");
const fileName = require("path").basename(__filename);

const cache = {};
const checkUser = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    if (authorization && authorization.startsWith("Bearer")) {
      token = authorization.split(" ")[1];
      if (!token) return res.status(401).send({ error: "Auth error" });

      let decoded = jwt.verify(token, process.env.SALT); // {userId: 1}
      req.user = decoded;
      res.setHeader("Last-Modified", new Date().toUTCString());

      const now = new Date().getTime();
      if (!cache[get(req, "user.userId")] && now - get(cache, `${get(req, "user.userId")}.lastUpdateCacheAt`, 0) > 3600000) {
        // let requestTime = new Date().getTime();
        const user = await UserModel.findById(get(req, "user.userId"));
        // console.log(`${new Date().getTime() - requestTime}ms`);

        if (isEmpty(user)) return res.status(401).send({ error: "Unauthorized" });
        req.user = Object.assign({}, req.user, get(user, "_doc"));
        cache[get(req, "user.userId")] = get(user, "_doc");
        cache[get(req, "user.userId")].lastUpdateCacheAt = new Date().getTime();
      } else if (cache[get(req, "user.userId")]) {
        req.user = Object.assign({}, req.user, cache[get(req, "user.userId")]);
      }

      next();
    } else {
      res.status(401).send({
        error: "Unauthorized",
      });
    }
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      res.status(401).send({
        error: "Token expired",
      });
    } else {
      logger.error(`${e.message} -> ${fileName} -> ${e} -> ${e.stack}`);
      res.status(401).send({ error: "Auth error" });
    }
  }
};

module.exports = {
  checkUser,
};
