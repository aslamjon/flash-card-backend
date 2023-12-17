const fs = require("fs");
const { IMAGES_PATH, DATA_PATH } = require("../../config");
const { download } = require("../downloadPronunciation/downloadFile");
const { createDefaultFolder } = require("../../utils/utiles");

const name = "essential-english-words-6";

let res = fs.readFileSync(`${DATA_PATH}/${name}.json`);
res = JSON.parse(res);

const types = {
  adj: "adj",
  adv: "adv",
  n: "noun",
  v: "verb",
  pron: "pronoun",
  prep: "preposition",
  conj: "conjunction",
  int: "interjection",
};

let list = [];
console.time("forEach");
res.forEach((unit, ind) => {
  if (ind < 30) {
    unit.wordlist.forEach((word, i) => {
      const [pron, type] = word.pron.replace(".", "").split(" ");
      word.url = `https://www.essentialenglish.review/apps-data/4000-${name}/data/unit-${ind + 1}/wordlist/${word.image}`;
      const filePath = `${IMAGES_PATH}/${types[type]}`;
      if (!types[type]) {
        console.log(ind + 1, i + 1, types[type], type);
        console.log(word);
        throw new Error("error");
      }
      createDefaultFolder(filePath);

      word.filePath = `${filePath}/${word.en.toLowerCase()}.jpg`;
      if (ind === 22 && i === 0) {
        console.log(filePath);
      }
      list.push(word);
    });
  }
});

const init = ({
  array,
  index,
  endIndex,
  infinity,
  dataRef = { current: {}, resCounter: 0, failed: {} },
  cb = () => {},
  chunkCount = 100,
  chunkCb = () => {},
  showCounter = false,
}) => {
  const start = new Date().getTime();
  const elem = array[index];
  const vocab = elem.en;

  download(elem.url, elem.filePath)
    .then(() => {
      if (showCounter) {
        console.log(`${dataRef.resCounter} downloaded successfully`, endIndex, index, ((new Date().getTime() - start) / 1000).toFixed(1) + "s");
      }
      if (dataRef.resCounter === endIndex) return cb(dataRef.current, dataRef.failed, dataRef.resCounter);
      if (dataRef.resCounter % chunkCount === 0 && dataRef.resCounter !== 0) chunkCb(dataRef.current, dataRef.failed, dataRef.resCounter);

      dataRef.resCounter++;
    })
    .catch((err) => {
      dataRef.failed[vocab] = err;

      if (dataRef.resCounter === endIndex) return cb(dataRef.current, dataRef.failed, dataRef.resCounter);
      dataRef.resCounter++;

      if (showCounter) {
        console.log(`${dataRef.resCounter} failed`, endIndex, index, ((new Date().getTime() - start) / 1000).toFixed(1) + "s");
      }
      console.error("Error while downloading:", err.response.status, err.response.data);
    });

  setTimeout(() => {
    if (index < endIndex && index < array.length && infinity)
      init({
        array,
        index: ++index,
        endIndex,
        infinity,
        dataRef,
        cb,
        chunkCount,
        chunkCb,
        showCounter,
      });
  }, 1);
};

// console.time(`start`);
// init({
//   array: list,
//   index: 0,
//   endIndex: list.length - 1,
//   infinity: true,
//   // showCounter: true,
//   cb: (res, fail, counter) => {
//     console.timeEnd("start");
//     fs.writeFileSync("fail.json", JSON.stringify(fail, null, 2));
//     console.log("fail", fail);
//   },
//   chunkCount: 100,
//   chunkCb: (res, fail, counter) => {
//     // console.log(`${counter} is complated`);
//   },
// });
