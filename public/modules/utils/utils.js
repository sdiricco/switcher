const fs = require("fs").promises;
const path = require("path");

/**
 * Saves a JSON object to file.
 * @param {string} file Path of output file
 * @param {Object} jsonObj The json object
 */
const saveJSON = async function (file, jsonObj) {
  try {
    const exsistPath = await existsFile(file);
    if (!exsistPath) {
      const __path = path.dirname(file);
      await fs.mkdir(__path, {
        recursive: true
      })
    }
    const json = JSON.stringify(jsonObj, null, 2);
    await fs.writeFile(file, json);
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Saves a JSON object to file.
 * @param {string} file Path of file to load
 */
const loadJSON = async function (file) {
  let jsonObj = {};
  try {
    const json = await fs.readFile(file);
    jsonObj = JSON.parse(json);
  } catch (e) {
    throw e;
  }
  return jsonObj;
};

/**
 * Saves a JSON object to file.
 * @param {string} path Path of output file
 * @param {Object} jsonObj The json object
 */
const existsFile = async (file) => {
  try {
    await fs.access(file);
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
  return true;
};

module.exports = {existsFile, loadJSON, saveJSON}