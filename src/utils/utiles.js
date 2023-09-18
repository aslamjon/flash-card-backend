const fs = require("fs");
const path = require("path");
const { Types } = require("mongoose");
const { errors } = require("./constants");
const { isString, isEmpty, get, isArray } = require("lodash");
const logger = require("./logger");
const config = require("../config");
const moment = require("moment");
const axios = require("axios");
const { UpdateModel } = require("../models/updateModel");
// const { FileModel } = require("../models/fileModel");
const { errorFormat } = require("./constants");
const { download } = require("../services/downloadPronunciation/downloadFile");
const { FlashCardModel } = require("../models/flashCardModel");

const writeData = (filename, content) => {
  fs.writeFile(filename, JSON.stringify(content, null, 4), "utf8", (err) => {
    if (err) console.log(err);
  });
};

const handleError = (err, res) => {
  // console.log("ERROR", err);
  res.status(500).contentType("text/plain").send({ message: "Oops! Something went wrong!" });
};

const createDefaultFolder = (dirName) => !fs.existsSync(dirName) && fs.mkdirSync(dirName, { recursive: true });

const getExtension = (file) => (get(file, "originalname", "") ? get(file, "originalname", "").split(".").pop() : "");

// *****************- Images -**********************
async function saveImg(req, res, file, types = [".png", ".jpeg", ".jpg"]) {
  try {
    const cacheImgPath = file.path;
    let originalName = file.originalname;

    function addDateTime(name, other = "") {
      const newDate = moment();
      const orginalNameArr = name.split(".");
      const fileType = orginalNameArr.pop();
      const getDate = newDate.format("DD-MM-YYYY");
      const getTime = newDate.format("HH-mm-ss-SSS");
      orginalNameArr.push(`__${getDate}__${getTime}${other}.${fileType}`);
      return orginalNameArr.join("");
    }

    originalName = addDateTime(originalName, `__${req.user.userId}`);
    // const targetPath = path.join(__dirname, `./../../data/images/${originalName}`);
    const targetPath = path.join(__dirname, `${config.IMAGES_PATH}/${originalName}`);

    // Create Img
    if (types.includes(path.extname(file.originalname).toLowerCase())) {
      const resultRename = await rename(cacheImgPath, targetPath);
      if (!resultRename) handleError("", res);
      else return originalName;
    } else {
      // Delete cache
      const resUnlik = await unlink(cacheImgPath);
      if (!resUnlik) handleError("", res);
      else {
        res
          .status(403)
          .contentType("text/plain")
          .send({ message: `Only ${types.join(", ")} files are allowed!` });
      }
    }
  } catch (error) {
    throw new Error(`${error.message} from saveImg`);
  }
}

async function newFileSaver(req, res, file, accept_type = [".png", ".jpeg", ".jpg"]) {
  try {
    if (!isEmpty(file)) {
      if (file.size <= config.LIMIT_FOR_UPLOADING_FILE_SIZE_IN_BAYTE) {
        const cacheFilePath = file.path;
        let originalName = file.originalname;

        function addDateTime(name, other = "", id = "") {
          const newDate = moment();
          const orginalNameArr = name.split(".");
          const fileType = orginalNameArr.pop();
          const getDate = newDate.format("DD-MM-YYYY");
          const getTime = newDate.format("HH.mm.ss.SSS");
          orginalNameArr.push(`_${id}_${getDate}_${getTime}${other}.${fileType}`);
          return orginalNameArr.join("");
        }

        const now = moment();
        const currentYear = now.year();
        const currentMonthName = now.format("MMMM");
        const dayOfMonth = now.date();

        // originalName = addDateTime(originalName, `__${req.user.userId}`);
        originalName = addDateTime(originalName, ``);

        const folder = `${currentYear}/${currentMonthName}/${dayOfMonth}`;
        let newPath = `${config.DATA_PATH}/${folder}`;
        createDefaultFolder(newPath);

        const targetPath = `${newPath}/${originalName}`;

        // Create Img
        if (isEmpty(accept_type) || accept_type.includes(path.extname(file.originalname).toLowerCase())) {
          const resultRename = await rename(cacheFilePath, targetPath);
          if (!resultRename) {
            throw new Error(errorFormat.FILE_NOT_RENAMED.error);
          } else {
            // let newFile = new FileModel({
            //   name: originalName,
            //   orginalName: file.originalname,
            //   contentType: file.mimetype,
            //   size: file.size,
            //   extension: getExtension(file),
            //   path: targetPath,
            //   folder,
            //   folderWithFile: `${folder}/${originalName}`,
            //   createdById: get(req, "user.userId"),
            // });
            // newFile.url = `${config.API_ROOT}/upload/file/${newFile._id.toString()}`;
            // newFile.url = `upload/file/${folder}/${originalName}`;
            // newFile.url = `upload/file/${newFile._id.toString()}`;
            // await newFile.save();
            // return newFile;
            // return {
            //   id: newFile._id,
            //   name: originalName,
            //   orginalName: file.originalname,
            //   contentType: file.mimetype,
            //   size: file.size,
            //   extension: getExtension(file),
            //   path: targetPath,
            //   folder,
            //   folderWithFile: `${folder}/${originalName}`,
            // };
          }
        } else {
          // Delete cache
          const resUnlik = await unlink(cacheFilePath);
          if (!resUnlik) {
            throw new Error(`file is not deleted from cache`);
          } else {
            throw new Error(`Only ${accept_type.join(", ")} files allowed!`);
          }
        }
      } else {
        throw new Error(errorFormat.FILE_SIZE_HAS_EXCEEDED_LIMIT.error);
      }
    } else {
      throw new Error(errorFormat.SEND_FILE_TO_FILE_FEILD.error);
    }
    return {};
  } catch (error) {
    throw new Error(`${error.message} from newFileSaver`);
  }
}

async function saveImgs(req, res, fieldnames = ["file"], fileTypes = [".pdf", ".jpeg", ".png", ".jpg", ".JPG"]) {
  try {
    if (isEmpty(req.files)) {
      req.files = [];
      return { error: `Bad request: please send ${fieldnames.join(", ")}`, status: 400 };
    } else if (req.files.length !== fieldnames.length) {
      for (let i = 0; req.files.length > i; i++) {
        // Delete cache
        const resUnlik = await unlink(req.files[i].path);
        if (!resUnlik) return { error: `Oops! Something went wrong!`, status: 600 };
      }
      return { error: `Bad request: please send ${fieldnames.join(", ")}`, status: 400 };
    } else {
      let imgs = {};
      // check fieldname
      for (let i = 0; fieldnames.length > i; i++) {
        if (!fieldnames.includes(req.files[i].fieldname)) return { error: `Bad request`, status: 400 };
      }

      for (let i = 0; fieldnames.length > i; i++) {
        imgs[req.files[i].fieldname] = await newFileSaver(req, res, req.files[i], fileTypes);
      }
      return imgs;
    }
  } catch (error) {
    return { error: error.message, status: 400 };
    // throw new Error("IMAGE_IS_NOT_SAVED")
  }
}

function rename(previousName, newName) {
  return new Promise((resolve, reject) => {
    fs.rename(previousName, newName, (err) => {
      if (err) resolve(0);
      resolve(1);
    });
  });
}
function unlink(tempPath) {
  return new Promise((resolve, reject) => {
    fs.unlink(tempPath, (err) => {
      if (err) resolve(0);
      resolve(1);
    });
  });
}
// ************************- encoding and decoding -********************************
const encodingBase64 = (filePath) => {
  const file = fs.readFileSync(filePath, { encoding: "base64" });
  // return file.toString('base64');
  return file;
};

const decodingBase64 = (data, fileName) => {
  let buff = new Buffer.from(data, "base64");
  fs.writeFileSync(fileName, buff);
};

function isInt(n) {
  return Number(n) === n && n % 1 === 0;
}

function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}

function toFixed(number, n = 2) {
  return Number(Number(number).toFixed(n));
}

const errorHandling = (e, functionName, res, fileName) => {
  axios
    .post("http://localhost:8083/api/v1/send", {
      message: `${e.message} -> ${fileName} -> ${functionName} -> \n\n ${e.stack}`,
      url: `http://${res.req.hostname}:${config.PORT}${res.req.originalUrl}`,
      project: config.APP_NAME,
      user: res.req.user ?? res.req.userId,
    })
    .catch((e) => {});
  require("./logger").error(`${e.message} -> ${fileName} -> ${functionName} -> \n\n ${e.stack}`);
  errors.SERVER_ERROR(res, { message: e.message });
};

const errorHandlerBot = (e, functionName, fileName, msg) => {
  axios
    .post("http://localhost:8083/api/v1/send", {
      message: `${e.message} -> ${fileName} -> ${functionName} -> \n\n ${JSON.stringify(msg)} -> \n\n ${e.stack}`,
      url: `none`,
      project: config.APP_NAME,
      user: "none",
    })
    .catch((e) => {});
  require("./logger").error(`${e.message} -> ${fileName} -> ${functionName} -> \n\n ${JSON.stringify(msg)} -> \n\n ${e.stack}`);
};
const hideFields = (items = {}) => ({
  deleted: 0,
  deletedAt: 0,
  deletedById: 0,
  updatedById: 0,
  updated: 0,
  __v: 0,
  password: 0,
  ...items,
});

const getDataFromModelByQuery = ({ Model, hideFieldQuery = {}, query = {}, withDelete = false }) => {
  return Model.find(withDelete ? query : { ...query, deleted: { $eq: false } }, hideFields(hideFieldQuery));
};
const getOneFromModelByQuery = ({ Model, hideFieldQuery = {}, query = {}, withDelete = false }) =>
  Model.findOne(withDelete ? query : { ...query, deleted: { $eq: false } }, hideFields(hideFieldQuery));

const getTimes = () => new Date().getTime();

const deleteFormat = ({ item = {}, id }) => {
  item.deleted = true;
  item.deletedAt = getTimes();
  item.deletedById = Types.ObjectId(id);
  return item;
};
const updateFormat = ({ item = {}, id }) => {
  item.updated = true;
  item.updatedAt = getTimes();
  item.updatedById = Types.ObjectId(id);
  return item;
};

const feildRemover = (item = {}, feilds = ["__v", "deleted", "deletedAt", "deletedById", "updatedById", "updated"]) => {
  if (!isArray(feilds)) return item;
  feilds.forEach((i) => (item[i] = undefined));
  return item;
};

const isLink = (link) => {
  if (isString(link)) {
    if (link.startsWith("http") || link.startsWith("https")) return true;
    else return false;
  }
  return false;
};

const updateModelHandler = async (arr, data, req, controllerName) => {
  let isChange = false;
  for (const i of arr) {
    if (!isEmpty(get(req.body, i, "").toString()) && `${data[i]}` !== get(req.body, i, "").toString()) {
      isChange = true;
    }
  }
  if (isChange) {
    const updateModel = new UpdateModel({
      oldValue: JSON.stringify(data),
      newValue: get(req.body),
      controllerName,
      valueId: data._id,
      createdById: Types.ObjectId(req.user.userId),
    });
    await updateModel.save();
  }

  return isChange ? updateFormat({ item: data, id: req.user.userId }) : data;
};

const smsCodeGenerator = () => {
  let code = Math.floor(Math.random() * 1000000);
  if (code < 100000) return smsCodeGenerator();
  return code;
};

const isNum = (num) => {
  num = `${num}`;
  let newNum = parseInt(num);
  if (isNaN(newNum)) return false;
  else if (newNum.toString() === num) return true;
  return false;
};

const isFile = (path) => fs.existsSync(path) && fs.lstatSync(path).isFile();

// ********************************************************

// const types = {
//   adj: "adj",
//   adv: "adv",
//   n: "noun",
//   v: "verb",
//   pron: "pronoun",
//   prep: "preposition",
//   conj: "conjunction",
//   int: "interjection",
// };

// (async () => {
//   const tagId = "64db1518a9a8f4a2ace3f1f1";
//   const createdById = "64cfacb7a5d863fa72e3ab3a";

//   let temp = {};
//   const flashcardsByTagId = await FlashCardModel.find({ tag: tagId });

//   let obj = {};
//   flashcardsByTagId.forEach((flash) => {
//     obj[flash.front + flash.type] = flash;
//   });
//   let counter = 1;

//   for (let i = 1; i < 7; i++) {
//     const name = `essential-english-words-${i}`;
//     let res = fs.readFileSync(`data/${name}.json`);
//     res = JSON.parse(res);

//     let list = [];

//     res.forEach((unit, ind) => {
//       if (ind < 30) {
//         unit.wordlist.forEach((word, i) => {
//           word.url = `https://www.essentialenglish.review/apps-data/4000-${name}/data/unit-${ind + 1}/wordlist/${word.image}`;
//           const filePath = `${config.IMAGES_PATH}/${word.en.toLowerCase()}.jpg`;
//           word.filePath = filePath;
//           const [pron, type] = word.pron.replace(".", "").split(" ");

//           temp[get(word, "en") + types[type]] = word;
//           list.push(word);
//         });
//       }
//     });

//     list.forEach(async (word, ind) => {
//       const [pron, type] = word.pron.replace(".", "").split(" ");

//       if (obj[get(word, "en") + types[type]]) {
//         // console.log(counter);
//         // counter++;
//         // console.log(obj[get(word, "en")]);
//         // console.log(word);
//         // const flash = await FlashCardModel.findOne({ tag: tagId, front: get(word, "en") });
//         // if (flash) {
//         //   console.log(counter);
//         //   counter++;
//         // }
//         // if (flash) {
//         //   flash.frontDescription = get(word, "exam");
//         //   flash.backDescription = get(word, "desc");
//         //   flash.transcription = pron;
//         //   flash.type = types[type];
//         //   await flash.save();
//         // }
//       } else {
//         console.log(word);
//         // const newWord = new FlashCardModel({
//         //   front: get(word, "en"),
//         //   back: "t",
//         //   frontDescription: get(word, "exam"),
//         //   backDescription: get(word, "desc"),
//         //   type: types[type],
//         //   transcription: pron,
//         //   tag: tagId,
//         //   createdById,
//         // });
//         // await newWord.save();
//         // console.log(counter);
//         // counter++;
//       }
//     });
//   }

//   console.log("finish");

//   // console.log(Object.keys(temp).length);
// })();

const requestLogger = (name, fileName, functionName) => {
  // logger.info(`request: ${name} -> ${fileName} -> ${functionName}`);
  return Date.now();
};
const responseLogger = (name, fileName, functionName, now) => {
  logger.info(`response: ${name} -> ${fileName} -> ${functionName} -> in ${Date.now() - now}ms`);
};
module.exports = {
  writeData,
  rename,
  unlink,
  saveImg,
  saveImgs,
  errorHandling,
  isInt,
  isFloat,
  toFixed,
  encodingBase64,
  decodingBase64,
  getTimes,
  hideFields,
  getDataFromModelByQuery,
  getOneFromModelByQuery,
  deleteFormat,
  updateFormat,
  isLink,
  updateModelHandler,
  smsCodeGenerator,
  errorHandlerBot,
  feildRemover,
  isNum,
  createDefaultFolder,
  isFile,
  requestLogger,
  responseLogger,
};
