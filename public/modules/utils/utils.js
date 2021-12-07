const fsPromises = require("fs").promises;
const path = require("path");
const SerialPort = require("serialport");


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
      await fsPromises.mkdir(__path, {
        recursive: true
      })
    }
    const json = JSON.stringify(jsonObj, null, 2);
    await fsPromises.writeFile(file, json);
  } catch (e) {
    throw e;
  }
};

/**
 * Load a JSON.
 * @param {string} file Path of file to load
 */
const loadJSON = async function (file) {
  let jsonObj = {};
  try {
    const json = await fsPromises.readFile(file);
    jsonObj = JSON.parse(json);
  } catch (e) {
    throw e;
  }
  return jsonObj;
};

const existsFile = async (file) => {
  try {
    await fsPromises.access(file);
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
  return true;
};

const getUsbDevices = async() =>{
  const spdevices = await SerialPort.list();
  console.log(spdevices)
  const devices = spdevices
    .map((device) => {
      return {
        name: device.manufacturer,
        port: device.path,
      };
    })
    .filter((device) => device.name);
  return devices;
}

const getAppConfig = async(appPath) => {
  let appConfig = undefined;
  try {
    const isAppConfExsist = await existsFile(appPath);
    if (!isAppConfExsist) {
      return appConfig;
    }
    appConfig = await loadJSON(APP_CONFIG_PATH);
  } catch (e) {
    throw e
  }
  return appConfig;
}

const saveAppConfig = async(appPath, jsonObj) => {
  try {
    await saveJSON(appPath, jsonObj);
  } catch (e) {
    throw(e)
  }
  return true;
}

module.exports = {existsFile, loadJSON, saveJSON, getUsbDevices, getAppConfig, saveAppConfig}