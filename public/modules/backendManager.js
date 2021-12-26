const { RelayJs } = require("@sdiricco/relayjs");
const EventEmitter = require("events");
const usbDetect = require("usb-detection");
const { existsFile, loadJSON, saveJSON, getUsbDevices } = require("./utils");

class BackendManager extends EventEmitter {
  constructor({ appSettingsPath = undefined, appConfigPath = undefined } = {}) {
    super();

    this.appSettingsPath = appSettingsPath;
    this.appConfigPath = appConfigPath;

    this.__errorWrapper = this.__errorWrapper.bind(this);
    this.rlyManagerConnect = this.rlyManagerConnect.bind(this);
    this.rlyManagerDisconnect = this.rlyManagerDisconnect.bind(this);
    this.rlyManagerWrite = this.rlyManagerWrite.bind(this);
    this.rlyManagerGetRelay = this.rlyManagerGetRelay.bind(this);
    this.rlyManagerGetRelays = this.rlyManagerGetRelays.bind(this);

    this.__onUsbDetectionChange = this.__onUsbDetectionChange.bind(this);

    this.relayjs = new RelayJs();
    usbDetect.startMonitoring();

    this.relayjs.on("error", (e) => {
      console.log(e)
      this.emit("rlymanager:error", {
        error: e,
        connected: this.relayjs.connected,
      });
    });

    usbDetect.on("change", this.__onUsbDetectionChange);
  }

  async __onUsbDetectionChange() {
    let devices = [];
    try {
      devices = await getUsbDevices();
    } catch (e) {
      throw e;
    }
    this.emit("usbdetection-changes", devices);
  }

  async __errorWrapper(promise) {
    const result = {
      success: false,
      data: undefined,
      error: {
        type: undefined,
        message: undefined,
        details: undefined,
      },
    };
    try {
      result.data = await promise;
      result.success = true;
    } catch (e) {
      result.success = false;
      result.error.message = e.message;
    }
    return result;
  }

  async rlyManagerConnect({
    port = undefined,
    size = undefined,
    options = undefined,
  } = {}) {
    let result = undefined;

    try {
      const promise = this.relayjs.connect({
        port: port,
        size: size,
        options: options,
      });

      result = await this.__errorWrapper(promise);

    } catch (e) {
      throw e;
    }
    result.data = {
      connected: this.relayjs.connected,
      relays: this.relayjs.relays,
      port: this.relayjs.port,
    };
    return result;
  }

  async rlyManagerDisconnect() {
    let result = undefined;

    try {
      const promise = this.relayjs.disconnect();

      result = await this.__errorWrapper(promise);

    } catch (e) {
      throw e;
    }

    result.data = {
      connected: this.relayjs.connected,
    }
    return result;
  }

  async rlyManagerWrite(relay, value) {
    let result = undefined;

    try {
      const promise = this.relayjs.write(relay, value);
      result = this.__errorWrapper(promise);
    } catch (e) {
      throw e;
    }

    return result;
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
        configPath: this.appConfigPath,
      });
    } catch (e) {
      throw e;
    }
    return true;
  }

  async appSaveSettings({ appConfigPath = undefined } = {}) {
    try {
      const json = {
        appConfigPath: appConfigPath,
      };
      await saveJSON(this.appSettingsPath, json);
    } catch (e) {
      throw e;
    }
    return true;
  }

  async appGetConfig(path) {
    let result = {
      config: undefined,
      path: undefined,
    };

    try {
      if (path) {
        this.appConfigPath = path;
      } else {
        const settings = await this.appGetSettings();
        this.appConfigPath = settings.configPath;
      }

      try {
        result.config = await loadJSON(this.appConfigPath);
      } catch (e) {
        //if not exsists
        return result;
      }

      await this.appSaveSettings({
        configPath: this.appConfigPath,
      });

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
