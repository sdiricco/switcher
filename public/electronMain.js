const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const appMenu = require("./modules/electronServices/app-menu")
const { BackendManager } = require("./backendManager");
const fs = require("fs");
const {saveDialog} = require("./modules/electronServices/utils")

let mainWindow = null;

const gotTheLock = app.requestSingleInstanceLock();
const APP_PATH = app.getPath("appData");
const APP_SETTINGS_PATH = path.join(APP_PATH, "relay-app-settings.json");
const APP_CONFIG_PATH = path.join(APP_PATH, "relay-app-config.json");
const isMac = process.platform === "darwin";

const backendManager = new BackendManager({
  appSettingsPath: APP_SETTINGS_PATH,
  appConfigPath: APP_CONFIG_PATH
});


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
    autoHideMenuBar: false,
    minWidth: 400,
    minHeight: 200,
    show: true,
    title: "Relay App",
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  const startURL = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startURL);

  mainWindow.removeMenu();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.toggleDevTools();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
    } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension: react developer`))
      .catch((err) =>
        console.log("An error occurred during add react extension ")
      );
  }
}

////////////////////////////////////////// handle Relay Manager \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

backendManager.setRlyManagerEvtCbk(sendRlyManagerMessage);

function sendRlyManagerMessage(message){
  mainWindow.webContents.send("relayjs:message", message);
}

ipcMain.handle("relayjs:connect", async (event, data) => {
  return  await backendManager.rlyManagerConnect(data);
});

ipcMain.handle("relayjs:disconnect", async (event, data) => {
  return await backendManager.rlyManagerDisconnect(data);
});

ipcMain.handle("relayjs:write", async (event, relay, value) => {
  return await backendManager.rlyManagerWrite(relay, value);
});

ipcMain.handle("relayjs:getstate", (event, data) => {
  return backendManager.rlyManagerGetState();
});

ipcMain.handle("relayjs:getrelay", (event, relay) => {
  return backendManager.rlyManagerGetRelay(relay)
});

ipcMain.handle("relayjs:getrelays", (event, data) => {
  return backendManager.rlyManagerGetRelays();
});

////////////////////////////////////////// handle Usb detection \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


backendManager.setUsbDetectionEvtCbk(sendUsbDetectionMessage);

function sendUsbDetectionMessage(devices){
  const portItems = devices.map(device => {
    return {
      label: device.port,
      click: ()=> onClickMenuItem(["Settings", "Port", device.port])
    }
  })
  appMenu.updateTemplateItem(mainWindow, ["Settings", "Port"], {
    label: "Port",
    submenu: [
      {label: "Auto", click: ()=> onClickMenuItem(["Settings", "Port", "Auto"])},
      ...portItems
    ]
  });
}

ipcMain.handle("usbdetection:getdevices", async (event, data) => {
  return await backendManager.usbDetectionGetDevices();
});

////////////////////////////////////////// handle app config \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


ipcMain.handle("app:getconf", async (event) => {
  return await backendManager.appGetConfig();
});

ipcMain.handle("app:saveconf", async (event, data) => {
  return await backendManager.appSaveConfig(data);
});

ipcMain.handle("app:getsettings", async(event, data) => {
  return await backendManager.appGetConfig(APP_SETTINGS_PATH);
})

ipcMain.handle("app:savesettings", async(event, data) => {
  await backendManager.appSaveConfig(APP_SETTINGS_PATH, data);
})

////////////////////////////////////////// handle extras \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("dom:loaded", async (event, jsonObj) => {
  appMenu.createTemplate(app, mainWindow, onClickMenuItem)

  const devices = await backendManager.usbDetectionGetDevices();

  const portItems = devices.map(device => {
    return {
      label: device.port,
      click: ()=> onClickMenuItem(["Settings", "Port", device.port])
    }
  })

  appMenu.updateTemplateItem(mainWindow, ["Settings", "Port"], {
    label: "Port",
    submenu: [
      {label: "Auto", click: ()=> onClickMenuItem(["Settings", "Port", "Auto"])},
      ...portItems
    ]
  });
});

function onClickMenuItem(tree){
  switch (tree[0]) {
    case "File":
      switch (tree[1]) {
        case "Open":
          onClickOpen();
          break;
        case "Save":
          onClickSave();
          break;
        case "Save as..":
          onClickSaveAs();
        default:
          break;
      }
      break;
    case "Settings":
      switch (tree[1]) {
        case "Port":
          onChangePort(tree[2]);
          break;
        default:
          break;
      }
    default:
      break;
  }
}

function onClickOpen(){
  console.log("open!")
}

function onClickSave(){
  console.log("save")
  mainWindow.webContents.send("menu:file:save");
}
async function onClickSaveAs(){
  mainWindow.webContents.send("menu:file:saveas");
}

ipcMain.handle("app:saveconfig", async(event, {showSaveDialog = false, data = {}} = {}) => {
  let filePath = undefined;

  if (showSaveDialog) {
    filePath = saveDialog(mainWindow);
    if (!filePath) {
      return true;
    }
  }

  await backendManager.appSaveConfig({path: filePath, json: data})

  return true;
})

function onChangePort(port){
  mainWindow.webContents.send("port:change", port);
}

ipcMain.handle("utils:open-custom-app-config", async (event, filter) => {
  try {
    const result = dialog.showOpenDialogSync(mainWindow, {
      properties: ["openFile"],
      // filters: filter,
    });

    if (result !== undefined) {
      return result[0];
    }
  } catch (e) {}

  return "";
});





