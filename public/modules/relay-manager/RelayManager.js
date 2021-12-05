const { RelayJs } = require("@sdiricco/relayjs");

class RelayManager {
  constructor() {
    this.relayjs = new RelayJs({
      inverseOut: true,
    });
    this.onUpdateStateCallbacks = [];
    this.connect = this.connect.bind(this);
    this.relayjs.on("error", this.onError);

  }

  onUpdateState(callback){
    
  }

  onError

  async connect(){
    const ret = {
      success: false,
      error: "",
    };
    try {
      ret.success = await this.relayjs.connect(data);
      this.onUpdateState();
    } catch (e) {
      this.onUpdateState({
        type: "",
        message: e.message,
        details: "",
      });
      ret.success = false;
      ret.error = e;
    }
    return ret;
  }

  async disconnect(){
    const ret = {
      success: false,
      error: "",
    };
    try {
      ret.success = await this.relayjs.disconnect();
      sendRlyState({
        type: "",
        message: "Board disconnected",
        details: "",
      });
    } catch (e) {
      ret.success = false;
      ret.error = e;
    }
    return ret;
  }

}


let __rlyState = () => {
  return {
    connected: relayjs.connected,
    port: relayjs.port,
    relays: relayjs.relays,
  };
};

let sendRlyState = (e) => {
  const defaultError = {
    type: "",
    message: "",
    details: "",
  };
  const error = e ? e : defaultError;
  const rlyState = __rlyState();
  mainWindow.webContents.send("relayjs-updatestate", error, rlyState);
};

//connect
ipcMain.handle("relayjs:connect", async (event, data) => {
  const ret = {
    success: false,
    error: "",
  };
  try {
    console.log(data);
    ret.success = await relayjs.connect(data);
    sendRlyState();
  } catch (e) {
    sendRlyState({
      type: "",
      message: e.message,
      details: "",
    });
    ret.success = false;
    ret.error = e;
  }
  return ret;
});

//connect
ipcMain.handle("relayjs-disconnect", async (event, data) => {
  const ret = {
    success: false,
    error: "",
  };
  try {
    ret.success = await relayjs.disconnect();
    sendRlyState({
      type: "",
      message: "Board disconnected",
      details: "",
    });
  } catch (e) {
    ret.success = false;
    ret.error = e;
  }
  return ret;
});

ipcMain.handle("relayjs-write", async (event, relay, value) => {
  const ret = {
    success: false,
    error: "",
  };
  try {
    ret.success = await relayjs.write(relay, value);
    sendRlyState();
  } catch (e) {
    ret.success = false;
    ret.error = e;
  }
  return ret;
});

ipcMain.handle("relayjs-getstate", (event, data) => {
  return __rlyState();
});

ipcMain.handle("relayjs-getrelay", (event, relay) => {
  return relayjs.relays[relay];
});

ipcMain.handle("relayjs-getrelays", (event, data) => {
  return relayjs.relays;
});

module.exports = {
  relayConnect,
  relayDisconnect,
  relayGetState,
  relayGet,
  relayGetAll,
  relaySet,
  relayOnUpdateState,
};
