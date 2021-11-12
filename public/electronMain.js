const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { RelayJs } = require("./modules/relayjs/relayjs");

let mainWindow = null;
const gotTheLock = app.requestSingleInstanceLock();

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
    minWidth: 600,
    minHeight: 200,
    show: true,
    title: "Example",
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

let relayjs = undefined;

//on error event
let onRelayJsError = async(e) => {
  let res = await requestReleyJsState();
  console.log("electronMain", e);
  mainWindow.webContents.send("relayjs-error", e, res);
};

//on update state event
let onReleyJsUpdate = (data) => {
  console.log(data);
  mainWindow.webContents.send("update-relayjs-state", data);
};

//request state
let requestReleyJsState = async () => {
  const res = {
    info: {
      port: "",
      connected: false,
    },
    relays: [],
  };
  if (!(relayjs instanceof RelayJs)) {
    return res;
  }
  res.relays = await relayjs.getAll();
  res.info.port = relayjs.port;
  res.info.connected = relayjs.__relayBoardHw.isConnected;
  return res;
};

//connect 
ipcMain.handle("connect", async (event, data) => {
  let res = await requestReleyJsState();
  if (res.info.connected) {
    onReleyJsUpdate(res);
    return true;
  }
  try {
    relayjs = new RelayJs({
      relayCount: 16,
    });
    await relayjs.connect();
    relayjs.on("error", (e) => {
      onRelayJsError(e);
    });
    const res = await requestReleyJsState();
    onReleyJsUpdate(res);
  } catch (e) {
    console.log(e);
    onRelayJsError(e);
    return false;
  }
  return true;
});


//set relay
ipcMain.handle("set-relay", async (event, i, v) => {
  let relays = [];
  try {
    await relayjs.set(i, v);
    relays = await relayjs.getAll();
    const res = await requestReleyJsState();
    onReleyJsUpdate(res);
  } catch (e) {
    onRelayJsError(e.message);
    return [];
  }
  return relays;
});

//get-state
ipcMain.handle("get-state", async (event, data) => {
  let res = undefined;
  if (data === undefined) {
    try {
      const res = await requestReleyJsState();
      onReleyJsUpdate(res);
    } catch (e) {
      onRelayJsError(e.message);
    }
  }
  return res;
});
