const axios = require("axios");
const cheerio = require("cheerio");
const { get } = require("lodash");
const fs = require("fs");

const baseUrl = "https://dictionary.cambridge.org";

const requestHandler = async (url, cb = () => "") => {
  const response = await axios.get(url);
  const html = response.data;

  if (response.status === 200) {
    const $ = cheerio.load(html);
    cb($);
    return $;
  }
};

const download = async (url, filename) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(fs.createWriteStream(filename));

  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve();
    });

    response.data.on("error", (err) => {
      reject(err);
    });
  });
};

const downloadCambridgeAudio = async (word, folderPath = "pronunciation/cambridge") => {
  try {
    const $vocab = await requestHandler(`https://dictionary.cambridge.org/pronunciation/english/${word}`);
    const children = Array.from($vocab("#audio2").children());
    const src = get(children, "[1].attribs.src");

    const filePath = `${folderPath}/${word}.mp3`;
    await download(baseUrl + src, filePath);
    return {
      downloaded: true,
      fileName: `${word}.mp3`,
      filePath,
      status: 200,
    };
  } catch (error) {
    return {
      downloaded: false,
      status: error.response.status,
    };
  }
};
module.exports = { downloadCambridgeAudio };
