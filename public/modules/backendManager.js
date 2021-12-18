const { RelayJs } = require("@sdiricco/relayjs");
const usbDetect = require("usb-detection");
const { existsFile, loadJSON, saveJSON, getUsbDevices } = require("./utils");

class BackendManager {
  constructor({ appSettingsPath = undefined, appConfigPath = undefined } = {}) {
    this.appSettingsPath = appSettingsPath;
    this.appConfigPath = appConfigPath;

    this.relayjs = new RelayJs();

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

  async rlyManagerConnect({
    port = undefined,
    size = undefined,
    options = undefined,
  } = {}) {
    let result = false;
    try {
      result = await this.relayjs.connect({
        port: port,
        size: size,
        options: options
      });
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

  async usbDetectionGetDevices() {
    return await getUsbDevices();
  }

  async appSaveConfig({ path = undefined, json = {} } = {}) {
    try {
      if (path) {
        this.appConfigPath = path;
      }
      await saveJSON(this.appConfigPath, json);
      await this.appSaveSettings({
        configPath: this.appConfigPath
      })
    } catch (e) {
      throw e;
    }
    return true;
  }

  async appSaveSettings({appConfigPath = undefined} = {}) {
    try {
      const json = {
        appConfigPath: appConfigPath
      }
      await saveJSON(this.appSettingsPath, json);
    } catch (e) {
      throw e;
    }
    return true;
  }

  async appGetConfig(path) {

    let result = {
      config: undefined,
      path: undefined
    }

    try {

      if (path) {
        this.appConfigPath = path;
      }else{
        const settings = await this.appGetSettings();
        this.appConfigPath = settings.configPath
      }

      try {
        result.config = await loadJSON(this.appConfigPath);
      } catch (e) {
        //if not exsists 
        return result;
      }

      await this.appSaveSettings({
        configPath: this.appConfigPath
      })

      result.path = this.appConfigPath;

    } catch (e) {
      throw e;
    }

    return result;
  }

  async appGetSettings() {

    let result = undefined;

    try {
      const exsist = await existsFile(this.appSettingsPath);

      if (!exsist) {
        return json;
      }

      result = await loadJSON(this.appSettingsPath);

    } catch (e) {
      throw e;
    }
    return result;
  }
}

module.exports = {
  BackendManager,
};
