const axios = require("axios");
const fs = require("fs");
const stream = require("stream");
const { promisify } = require("util");

const finished = promisify(stream.finished);

const download = async (url, filename) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);
    response.data.on("close", () => resolve(finished(writer)));
    response.data.on("error", (err) => reject(err));
  });
};

module.exports = { download };
