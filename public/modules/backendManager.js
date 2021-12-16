const { RelayJs } = require("@sdiricco/relayjs");
const usbDetect = require("usb-detection");
const {
  existsFile,
  loadJSON,
  saveJSON,
  getUsbDevices,
} = require("./utils");

class BackendManager {
  constructor({ appSettingsPath = undefined, appConfigPath = undefined } = {}) {

    this.appSettingsPath = appSettingsPath;
    this.appConfigPath = appConfigPath;

    this.relayjs = new RelayJs({
      inverseOut: true,
    });
    usbDetect.startMonitoring();

    this.rlyManagerEvtCbk = undefined;
    this.usbDetectionEvtCbk = undefined;

    this.__sendRlyManagerMessageToCbk =
      this.__sendRlyManagerMessageToCbk.bind(this);
    this.__onRlyManagerErr = this.__onRlyManagerErr.bind(this);
    this.setRlyManagerEvtCbk = this.setRlyManagerEvtCbk.bind(this);
    this.rlyManagerConnect = this.rlyManagerConnect.bind(this);
    this.rlyManagerDisconnect = this.rlyManagerDisconnect.bind(this);
    this.rlyManagerWrite = this.rlyManagerWrite.bind(this);
    this.rlyManagerGetState = this.rlyManagerGetState.bind(this);
    this.rlyManagerGetRelay = this.rlyManagerGetRelay.bind(this);
    this.rlyManagerGetRelays = this.rlyManagerGetRelays.bind(this);

    this.__onUsbDetectionChange = this.__onUsbDetectionChange.bind(this);
    this.setUsbDetectionEvtCbk = this.setUsbDetectionEvtCbk.bind(this);

    this.relayjs.on("error", this.__onRlyManagerErr);
    usbDetect.on("change", this.__onUsbDetectionChange);
  }

  setRlyManagerEvtCbk(callback) {
    if (typeof callback === "function") {
      this.rlyManagerEvtCbk = callback;
    }
  }

  setUsbDetectionEvtCbk(callback) {
    if (typeof callback === "function") {
      this.usbDetectionEvtCbk = callback;
    }
  }

  __onRlyManagerErr(event, e) {
    this.__sendRlyManagerMessageToCbk(e);
  }

  async __onUsbDetectionChange(event, e) {
    let devices = [];
    try {
      devices = await getUsbDevices();
    } catch (e) {
      throw e;
    }
    this.usbDetectionEvtCbk(devices);
  }

  __sendRlyManagerMessageToCbk(e) {
    if (typeof this.rlyManagerEvtCbk === "function") {
      const rlyMessage = {
        connected: this.relayjs.connected,
        port: this.relayjs.port,
        relays: this.relayjs.relays,
        error: e ? true : false,
        errorType: e ? e.type : "",
        errorMessage: e ? e.message : "",
        errorDetails: e ? e.details : "",
      };
      this.rlyManagerEvtCbk(rlyMessage);
    }
  }

  async rlyManagerConnect(data) {
    let result = false;
    try {
      result = await this.relayjs.connect(data);
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      throw e;
    }
    return result;
  }

  async rlyManagerDisconnect() {
    let result = false;
    try {
      result = await this.relayjs.disconnect();
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      throw e;
    }
    return result;
  }

  async rlyManagerWrite(relay, value) {
    let result = false;
    try {
      result = await this.relayjs.write(relay, value);
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      throw e;
    }
    return result;
  }

  rlyManagerGetState() {
    return {
      connected: this.relayjs.connected,
      port: this.relayjs.port,
      relays: this.relayjs.relays,
      error: undefined,
      errorType: undefined,
      errorMessage: undefined,
      errorDetails: undefined,
    };
  }

  rlyManagerGetRelay(relay) {
    return relayjs.relays[relay];
  }

  rlyManagerGetRelays() {
    return relayjs.relays;
  }
  
  rlyManagerSetCount(rlyCount){
    
  }

  async usbDetectionGetDevices() {
    return await getUsbDevices();
  }

  async appSaveConfig({
    path = undefined,
    json = {}
  } = {}) {
    try {
      if (path) {
        this.appConfigPath = path;
      }
      await saveJSON(this.appConfigPath, json);
    } catch (e) {
      throw e;
    }
    return true;
  }

  async appSaveSettings(jsonObj) {
    try {
      await saveJSON(this.appSettingsPath, jsonObj);
    } catch (e) {
      throw e;
    }
    return true;
  }

  async appGetConfig(path) {
    let json = undefined;
    try {
      if (path) {
        this.appConfigPath = path;
      }
      const exsist = await existsFile(this.appConfigPath);
      if (!exsist) {
        return json;
      }
      json = await loadJSON(this.appConfigPath);
    } catch (e) {
      throw e;
    }
    return json;
  }

  async appGetSettings() {
    let json = undefined;
    try {
      const exsist = await existsFile(this.appGetSettings);
      if (!exsist) {
        return json;
      }
      json = await loadJSON(this.appGetSettings);
    } catch (e) {
      throw e;
    }
    return json;
  }

}

module.exports = {
  BackendManager,
};
