const axios = require("axios");
const cheerio = require("cheerio");
const { get } = require("lodash");
const { download } = require("./downloadFile");
const { createDefaultFolder } = require("../../utils/utiles");

const baseUrl = "https://dictionary.cambridge.org";

const requestHandler = async (url, cb = () => "") => {
  const response = await axios.get(url, {
    timeout: 5000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const html = response.data;

  if (response.status === 200) {
    const $ = cheerio.load(html);
    cb($);
    return $;
  }
};

const downloadCambridgeAudio = async (word, folderPath = "pronunciation/cambridge") => {
  try {
    const $vocab = await requestHandler(`https://dictionary.cambridge.org/pronunciation/english/${word}`);
    const children = Array.from($vocab("#audio2").children());
    const src = get(children, "[1].attribs.src");

    createDefaultFolder(folderPath);
    const filePath = `${folderPath}/${word}.mp3`;
    const r = await download(baseUrl + src, filePath);
    return {
      downloaded: true,
      fileName: `${word}.mp3`,
      filePath,
    };
  } catch (error) {
    return {
      downloaded: false,
      status: get(error, "response.status"),
    };
  }
};
module.exports = { downloadCambridgeAudio };
