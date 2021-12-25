const path = require("path");
const { app, ipcMain, dialog, BrowserWindow } = require("electron");
const appMenu = require("./modules/electronServices/app-menu");
const { BackendManager } = require("./modules/backendManager");

require("./modules/electronServices/app-context-menu");

const APP_PATH = app.getPath("appData");
const APP_SETTINGS_PATH = path.join(APP_PATH, "relay-app-settings.json");
const APP_CONFIG_PATH = path.join(APP_PATH, "relay-app-config.json");

const {} = require("electron");
const gotTheLock = app.requestSingleInstanceLock();
const isDev = require("electron-is-dev");

let win = null;

function createWindow() {
  win = new BrowserWindow({
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

  win.loadURL(startURL);

  win.removeMenu();

  win.once("ready-to-show", () => {
    win.show();
    if (isDev) {
      win.toggleDevTools();
    }
  });
  win.on("closed", () => {
    win = null;
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

function onSecondInstance(event, commandLine, workingDirectory) {
  if (!win) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
}

function onWindowAllClosed() {
  // Quit when all windows are closed.
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
}

function onActivate(){
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", onSecondInstance);
  app.on("ready", createWindow);
  app.on("window-all-closed", onWindowAllClosed);
  app.on("activate", onActivate);
}

const backendManager = new BackendManager({
  appSettingsPath: APP_SETTINGS_PATH,
  appConfigPath: APP_CONFIG_PATH,
});

////////////////////////////////////////// dialog \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("message-box", async (event, options) => {
  return dialog.showMessageBoxSync(win, options);
});

////////////////////////////////////////// dom loaded \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("dom:loaded", async (event, jsonObj) => {
  appMenu.createTemplate(app, win, onClickMenuItem);

  const devices = await backendManager.usbDetectionGetDevices();
  updateMenuPortItems(devices);
});

////////////////////////////////////////// handle Relay Manager \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

backendManager.on("rlymanager-changes", (message)=>{
  win.webContents.send("relayjs:message", message);
})

ipcMain.handle(
  "relayjs:connect",
  async (
    event,
    { port = undefined, size = undefined, options = undefined } = {}
  ) => {
    return await backendManager.rlyManagerConnect({
      port: port,
      size: size,
      options: options,
    });
  }
);

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
  return backendManager.rlyManagerGetRelay(relay);
});

ipcMain.handle("relayjs:getrelays", (event, data) => {
  return backendManager.rlyManagerGetRelays();
});

////////////////////////////////////////// handle Usb detection \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

backendManager.on("usbdetection-changes", (devices)=>{
  win.webContents.send("usbdetection:update", devices);
})

ipcMain.handle("usbdetection:getdevices", async (event, data) => {
  return await backendManager.usbDetectionGetDevices();
});

////////////////////////////////////////// handle menu \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function onClickMenuItem(tree) {
  win.webContents.send("menu:action", tree);
}

////////////////////////////////////////// handle app \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("app:settitle", async (event, title) => {
  win.setTitle(title);
});

ipcMain.handle(
  "app:saveconfig",
  async (event, { showSaveDialog = false, data = {} } = {}) => {
    let filePath = undefined;
    if (showSaveDialog) {
      filePath = dialog.showSaveDialogSync(win, {
        title: "Save",
        buttonLabel: "Save",
        defaultPath: ".json",
        filters: [{ name: "json", extensions: ["json"] }],
      });
      if (!filePath) {
        return true;
      }
    }
    await backendManager.appSaveConfig({ path: filePath, json: data });
    return true;
  }
);

ipcMain.handle(
  "app:openconfig",
  async (event, { openFromExplorer = false } = {}) => {
    const result = {
      config: {},
      path: undefined,
    };

    if (openFromExplorer) {
      const listOfFilePath = dialog.showOpenDialogSync(win, {
        properties: ["openFile"],
        filters: [{ name: "json", extensions: ["json"] }],
      });
      result.path = listOfFilePath[0];
    }

    const data = await backendManager.appGetConfig(result.path);

    console.log(data);

    result.config = data.config;
    result.path = data.path;

    return result;
  }
);

ipcMain.handle("menu:port:update", async (event, devices) => {
  updateMenuPortItems(devices);
});

////////////////////////////////////////// aux functions \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function updateMenuPortItems(devices) {
  console.log(devices);
  const portItems = devices.map((device) => {
    return {
      type: "radio",
      label: device.port,
      checked: false,
      click: () => onClickMenuItem(["Settings", "Port", device.port]),
    };
  });

  appMenu.updateTemplateItem(win, ["Settings", "Port"], {
    label: "Port",
    submenu: [
      {
        type: "radio",
        label: "Auto",
        checked: true,
        click: () => onClickMenuItem(["Settings", "Port", "Auto"]),
      },
      ...portItems,
    ],
  });
}
