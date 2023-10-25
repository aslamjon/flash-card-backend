const { createDefaultFolder } = require("../../utils/utiles");
const { download } = require("./downloadFile");

const downloadGoogleAudio = async (word, folderPath = "pronunciation/google") => {
  try {
    createDefaultFolder(folderPath);
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
    // console.log("google error:", error.response);
    return {
      downloaded: false,
      status: 500,
    };
  }
};
module.exports = {
  downloadGoogleAudio,
};
