const path = require("path");
const fileName = path.basename(__filename);
const { FileModel: DBModle } = require("../models/fileModel");
const { isFile } = require("../utils/utiles");
const { isEmpty, get } = require("lodash");
// const fs = require("fs");

const filePathCache = {};

const setHeaderForContentDesposition = (res, viewParam, fileName) => {
  if (viewParam === "open") {
    res.setHeader("Content-Disposition", `inline`);
  } else {
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  }
  return res;
};

const uploadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const viewParam = req.query.view || "open";

    res.set({
      "Cache-Control": "public, max-age=86400", // Cache the file for one day
      Expires: new Date(Date.now() + 86400000).toUTCString(), // Expires header for one day
    });

    const twoDaysInMilliseconds = 1000 * 60 * 60 * 24 * 2;
    if (!isEmpty(filePathCache[id]) && new Date().getTime() - get(filePathCache[id], "date") < twoDaysInMilliseconds) {
      const fileName = path.basename(get(filePathCache[id], "filePath"));
      res = setHeaderForContentDesposition(res, viewParam, fileName);

      // Check if the file exists
      // if (fs.existsSync(get(filePathCache[id], "fullPath"))) {
      //   res.setHeader("Content-Type", "application/octet-stream");

      //   const fileStream = fs.createReadStream(get(filePathCache[id], "fullPath"));
      //   fileStream.pipe(res);
      // } else {
      //   return res.status(404).send("File not found");
      // }
      return res.sendFile(get(filePathCache[id], "fullPath"));
    }

    const file = await DBModle.findById(id);

    const fileName = path.basename(file.path);

    res = setHeaderForContentDesposition(res, viewParam, fileName);

    const filePath = path.join(__dirname, `../../${file.path}`);

    if (isFile(filePath)) {
      filePathCache[id] = {
        fullPath: filePath,
        filePath: file.path,
        date: new Date().getTime(),
      };
    }
    // Check if the file exists
    // if (fs.existsSync(filePath)) {
    //   res.setHeader("Content-Type", "application/octet-stream");

    //   const fileStream = fs.createReadStream(filePath);
    //   fileStream.pipe(res);
    // } else return res.status(404).send("File not found");

    res.sendFile(filePath);
  } catch (e) {
    errorHandling(e, updateById.name, res, fileName);
  }
};

module.exports = {
  uploadFile,
};
