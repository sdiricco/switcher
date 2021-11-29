const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  ipcRenderer,
} = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { RelayJs } = require("@sdiricco/relayjs");
const { existsFile, loadJSON, saveJSON, getUsbDevices } = require("./modules/utils/utils");
const usbDetect = require("usb-detection");

let mainWindow = null;
const gotTheLock = app.requestSingleInstanceLock();
const APP_PATH = app.getPath("appData");
const APP_CONFIG_PATH = path.join(APP_PATH, "relayjs-data", "config.json");
console.log(APP_CONFIG_PATH);
const RELAY_MODULE = 1;

const showMessageBox = (options) => {
  let __options = {
    buttons: options.buttons || ["ok"],
    message: options.message || "?",
    title: options.title || "Info",
    type: options.type || "question",
  };
  return dialog.showMessageBoxSync(mainWindow, __options);
};

ipcMain.handle("message-box", async (event, options) => {
  showMessageBox(options);
});

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) myWindow.restore();
      mainWindow.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.on("ready", createWindow);

  // Quit when all windows are closed.
  app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    minWidth: 400,
    minHeight: 200,
    show: true,
    title: "Relay App",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  const startURL = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startURL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.toggleDevTools();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.removeMenu();

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
    } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log("An error occurred: ", err));
  }
}

////////////////////////////////////////// handle Relaysjs \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

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

let relayjs = new RelayJs({
  inverseOut: true,
});
relayjs.on("error", sendRlyState);

//connect
ipcMain.handle("relayjs:connect", async (event, data) => {
  const ret = {
    success: false,
    error: "",
  };
  try {
    ret.success = await relayjs.connect(data);
    console.log(relayjs.relays);
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

////////////////////////////////////////// utils \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

usbDetect.startMonitoring();
usbDetect.on("change", async () => {
  const devices = await getUsbDevices();
  mainWindow.webContents.send("utils:update-usb-devices", devices);
});

ipcMain.handle("utils:get-usb-devices", async(event, data) => {
  const devices = await getUsbDevices();
  return devices;
})

ipcMain.handle("utils:get-app-conf", async (event, data) => {
  const res = {
    success: false,
    error: "",
    data: {},
  };
  try {
    const isAppConfExsist = await existsFile(APP_CONFIG_PATH);
    if (!isAppConfExsist) {
      res.success = false;
      return res;
    }
    const jsonObj = await loadJSON(APP_CONFIG_PATH);
    res.success = true;
    res.data = jsonObj;
  } catch (e) {
    res.error = e.message;
    res.success = false;
  }
  console.log(res);
  return res;
});

ipcMain.handle("utils:save-app-conf", async (event, jsonObj) => {
  const ret = {
    success: false,
    error: "",
    data: {},
  };
  try {
    console.log(APP_CONFIG_PATH);
    await saveJSON(APP_CONFIG_PATH, jsonObj);
    ret.success = true;
  } catch (e) {
    ret.success = false;
    ret.error = e.message;
  }
  return ret;
});
