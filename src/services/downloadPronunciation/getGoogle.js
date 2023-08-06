const axios = require("axios");
const { get } = require("lodash");
const fs = require("fs");

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

const downloadGoogleAudio = async (word, folderPath = "pronunciation/google") => {
  try {
    word = word.toLocaleLowerCase();
    const filePath = `${folderPath}/${word}.mp3`;

    await download(`https://ssl.gstatic.com/dictionary/static/pronunciation/2022-03-02/audio/${word.substring(0, 2)}/${word}_en_us_1.mp3`, filePath);
    return {
      downloaded: true,
      fileName: `${word}.mp3`,
      filePath,
      status: 200,
    };
  } catch (error) {
    console.log("google error:", error);
    return {
      downloaded: true,
      status: 200,
    };
  }
};
module.exports = {
  downloadGoogleAudio,
};
