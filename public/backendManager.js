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
    let result = false;
    try {
      result = await this.relayjs.connect(data);
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      throw(e)
    }
    return result;
  }

  async rlyManagerDisconnect() {
    let result = false;
    try {
      result = await this.relayjs.disconnect();
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      throw(e)
    }
    return result;
  }

  async rlyManagerWrite(){
    let result = false;
    try {
      result = await relayjs.write(relay, value);
      this.__sendRlyManagerMessageToCbk();
    } catch (e) {
      throw(e)
    }
    return result;
  }

  rlyManagerGetState(){
    return {
      connected: this.relayjs.connected,
      port: this.relayjs.port,
      relays: this.relayjs.relays,
      error: undefined,
      errorType: undefined,
      errorMessage: undefined,
      errorDetails: undefined
    }
  }

  rlyManagerGetRelay(relay){
    return relayjs.relays[relay];
  }

  rlyManagerGetRelays(){
    return relayjs.relays;
  }
}

module.exports = {
  BackendManager
};
