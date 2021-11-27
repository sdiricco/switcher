const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { RelayJs } = require("@sdiricco/relayjs");

let mainWindow = null;
const gotTheLock = app.requestSingleInstanceLock();

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

let relayjs = new RelayJs();

let __rlyState = () =>{
  return{
    connected: relayjs.connected,
    port: relayjs.port,
    relays: relayjs.relays
  }
}

//on error event
let sendRlyError = (e) => {

    let error = "";
    if (e && e.type) {
      //from error event
      error = e.message;
    } else{
      //from catch in try-catch stameants
      error = e;
    }

    mainWindow.webContents.send("relayjs-error", error);
    sendRlyState();
};

let sendRlyState = (e) => {
  mainWindow.webContents.send("relayjs-updatestate", __rlyState());
};

//connect 
ipcMain.handle("relayjs-connect", async (event, data) => {
  try {
    await relayjs.connect();
    console.log(relayjs.relays)
    relayjs.on("error", sendRlyError)
    sendRlyState();
  } catch (error) {
    console.log(e);
    sendRlyError(e);
    return false;
  }
  return true;
});

//connect 
ipcMain.handle("relayjs-disconnect", async (event, data) => {
  try {
    await relayjs.disconnect();
    relayjs.on("error", sendRlyError)
    sendRlyState();
  } catch (error) {
    console.log(e);
    sendRlyError(e);
    return false;
  }
  return true;
});

ipcMain.handle("relayjs-write", async (event, relay, value) => {
  try {
    await relayjs.write(relay, value)
    sendRlyState();
  } catch (e) {
    console.log(e);
    sendRlyError(e);
    return false;
  }
  return true;
});

ipcMain.handle("relayjs-getstate", (event, data) => {
  return __rlyState();
});

ipcMain.handle("relayjs-getrelay", (event, relay) => {
  return relayjs.relays[relay];
});

ipcMain.handle("relayjs-getrelays", (event) => {
  return relayjs.relays;
});
