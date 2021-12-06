const { RelayJs } = require("@sdiricco/relayjs");

class BackendManager {
  constructor() {
    this.relayjs = new RelayJs({
      inverseOut: true,
    });
    this.rlyManagerEvtCbk = undefined;

    this.__onRlyManagerErr = this.__onRlyManagerErr.bind(this);
    this.__sendRlyManagerMessageToCbk = this.__sendRlyManagerMessageToCbk.bind(this);
    this.connect = this.connect.bind(this);
    this.relayjs.on("error", this.__onRelayJsError);
  }

  set rlyManagerEvtCbk(callback) {
    if (typeof callback === "function") {
      this.rlyManagerEvtCbk = callback;
    }
  }

  get rlyManagerEvtCbk() {
    return this.rlyManagerEvtCbk;
  }

  __onRlyManagerErr(event, e) {
    this.__sendRlyManagerMessageToCbk(e);
  }

  __sendRlyManagerMessageToCbk(e) {
    if (typeof this.rlyManagerEvtCbk === "function") {
      const rlyMessage = {
        connected: this.relayjs.connected,
        port: this.relayjs.port,
        relays: this.relayjs.relays,
        error: e ? true : false,
        errorType: e ? e.type : "",
        errorMessage: e? e.message : "",
        errorDetails: e? e.details : ""
      }
      this.rlyManagerEvtCbk(rlyMessage);
    }
  }

  async rlyManagerConnect() {
    const ret = {
      success: false,
      data: undefined,
      error: undefined,
    };
    try {
      ret.success = await this.relayjs.connect(data);
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      ret.success = false;
      ret.error = e.message;
    }
    return ret;
  }

  async rlyManagerDisconnect() {
    const ret = {
      success: false,
      data: undefined,
      error: undefined,
    };
    try {
      ret.success = await this.relayjs.disconnect();
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      ret.success = false;
      ret.error = e.message;
    }
    return ret;
  }

  async rlyManagerWrite(){
    const ret = {
      success: false,
      data: undefined,
      error: undefined,
    };
    try {
      ret.success = await relayjs.write(relay, value);
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      ret.success = false;
      ret.error = e.message;
    }
    return ret;
  }

  rlyManagerGetState(){
    const ret = {
      success: true,
      data: undefined,
      error: undefined,
    };
    ret.data = {
      connected: this.relayjs.connected,
      port: this.relayjs.port,
      relays: this.relayjs.relays,
      error: undefined,
      errorType: undefined,
      errorMessage: undefined,
      errorDetails: undefined
    }
    return ret;
  }

  rlyManagerGetRelay(relay){
    const ret = {
      success: true,
      data: undefined,
      error: undefined,
    };
    ret.data = relayjs.relays[relay];
    return ret;
  }

  rlyManagerGetRelays(){
    const ret = {
      success: true,
      data: undefined,
      error: undefined,
    };
    ret.data = relayjs.relays;
    return ret;
  }
}

module.exports = {
  BackendManager
};
