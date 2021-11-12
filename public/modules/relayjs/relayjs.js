const EventEmitter = require("events");
const { resolve } = require("path");

const types = ["RelayJ5"];
const defaultType = types[0];

const relaysFamily = [1, 2, 4, 8, 16];
const ARDUINO_NANO_MAX_PIN = 19;
const ON = 1;
const OFF = 0;
const OPEN = 0;
const CLOSE = 1;

function __check(type, data, data_ext) {
  let isOk = true;
  switch (type) {
    case "RELAY_COUNT":
      if (
        data === undefined ||
        isNaN(data) ||
        !relaysFamily.some((el) => el === data)
      ) {
        isOk = false;
      }
      break;
    case "TYPE":
      if (data === undefined || (data !== "NO" && data !== "NC")) {
        isOk = false;
      }
      break;
    case "PIN":
      if (data === undefined || isNaN(data) || data >= data_ext) {
        isOk = false;
      }
      break;
    case "RELAYS_CONFIGURATION":
      if (data && Array.isArray(data) && data.length < data_ext) {
        for (const el of data) {
          __check("PIN", el.pin, data_ext);
          __check("TYPE", el.type);
        }
      }
      break;
    default:
      break;
  }
  return isOk;
}

function __validateConstructorParameter(options) {
  let passed = false;

  if (typeof options !== "object") {
    throw "passed a non object param";
  }

  passed = __check("RELAY_COUNT", options.relayCount);
  if (!passed) {
    throw "relayCount must be a number in range: [1, 2, 4, 8, 16]";
  }

  if (options.defaultType) {
    passed = __check("TYPE", options.defaultType);
    if (!passed) {
      throw "defaultType must be NO or NC";
    }
  }

  let defaultRelaysConfiguration = [];
  for (let i = 0; i < options.relayCount; i++) {
    defaultRelaysConfiguration.push({
      pin: i,
      type: options.defaultType || "NO",
    });
  }
  if (options.relaysConfiguration) {
    passed = __check(
      "RELAYS_CONFIGURATION",
      options.relaysConfiguration,
      options.relayCount
    );
    if (!passed) {
      throw "relaysConfiguration must be an array of valid objects";
    }
  }

  let boardConfiguration = {
    relayCount: options.relayCount,
    defaultType: options.defaultType || "NO",
    relaysConfiguration:
      options.relaysConfiguration || defaultRelaysConfiguration,
  };

  return boardConfiguration;
}

/**
 *
 * Class RelaysJs.
 * @extends EventEmitter
 */
class RelayJs extends EventEmitter {
  /**
   *
   * @param {Number} relayCount - The number of relay board.
   */
  constructor(options) {
    super();

    try {
      this.__boardConfiguration = __validateConstructorParameter(options);
      this.__relays = [];
      this.__relayBoardHw = undefined;
      this.__port = undefined;
      this.__initializeRelays();
  
      if (defaultType === "RelayJ5") {
        const { RelayBoardHw } = require("./relayhw-j5");
        this.__relayBoardHw = new RelayBoardHw({ relayCount: ARDUINO_NANO_MAX_PIN });
      }

    } catch (e) {
      throw e;
    }

    this.__relayBoardHw.on("error", (e) => {
      this.emit("error", e);
    });
  }

  /**
   *
   * @returns {Number[]} The relay board type supported
   */
  static getRelaysFamily() {
    return relaysFamily;
  }

  /**
   *
   * @returns {String} The port connected to the relay board
   */
  get port() {
    return this.__port;
  }

  /**
   *
   * @returns {String} The port connected to the relay board
   */
  get relayCount() {
    return this.__relayCount;
  }

  async connect(options = undefined) {
    try {
      await this.__relayBoardHw.connect(options);
      this.__port = this.__relayBoardHw.__port;
    } catch (e) {
      console.log(e.message);
    }
  }

  async set(n = undefined, value = undefined) {
    if (!this.__relayBoardHw.isConnected) {
      throw new Error("Connect the board before");
    }
    if (n === undefined) {
      throw new Error("relayNumber cannot be undefined");
    }
    if (isNaN(n)) {
      throw new Error("n must be Number type");
    }
    if (n < 0 || n > ARDUINO_NANO_MAX_PIN) {
      throw new Error(`n must be in range [${0} - ${ARDUINO_NANO_MAX_PIN}]`);
    }

    if (value === undefined) {
      throw new Error("value cannot be undefined");
    }
    if (isNaN(value)) {
      throw new Error("value must be Number type");
    }
    if (value < 0 || value > 1) {
      throw new Error("value must be in range [0 - 1]");
    }

    try {
      await this.__relayBoardHw.set(n, value);
      const idx = this.__relays.findIndex((el) => el.pin === n)
      this.__relays[idx].value = value;
    } catch (e) {
      throw e;
    }
  }

  async get(n = undefined) {
    const r = this.__relays.find(r => r.pin === n);
    if (r === undefined) {
      throw `Received ${n} instead a number in range [0 - ${this.__boardConfiguration.relayCount}]`
    }
    return r.value;
  }

  async setMulti(relays = []) {
    if (relays === undefined || relays.length === 0) {
      throw new Error(
        "relaysValue shall be an array of value, eg [0, 1, 0, 1, 1]"
      );
    }
    if (relays.length > this.__relayCount) {
      throw new Error(`You can set maximum ${this.__relayCount} relay`);
      ì;
    }
    for (let i = 0; i < relays.length; i++) {
      try {
        await this.set(i, relays[i]);
      } catch (e) {
        throw new Error(`Relay ${i}: ${e.message}`);
      }
    }
  }

  getAll() {
    return this.__relays;
  }

  __initializeRelays(){
    this.__relays = this.__boardConfiguration.relaysConfiguration.map(r => {
      let value = r.type === 'NO' ? OPEN : CLOSE
      return {
        pin: r.pin,
        type: r.type,
        value: value
      }
    })
  }
}

module.exports = { RelayJs, ON, OFF };
