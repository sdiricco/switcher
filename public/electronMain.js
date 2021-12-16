const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const appMenu = require("./modules/electronServices/app-menu");
const { BackendManager } = require("./backendManager");
const { saveDialog, openDialog } = require("./modules/electronServices/utils");
require("./modules/electronServices/context-menu");
const { appInit } = require("./modules/electronServices/app-init");


const APP_PATH = app.getPath("appData");
const APP_SETTINGS_PATH = path.join(APP_PATH, "relay-app-settings.json");
const APP_CONFIG_PATH = path.join(APP_PATH, "relay-app-config.json");

const backendManager = new BackendManager({
  appSettingsPath: APP_SETTINGS_PATH,
  appConfigPath: APP_CONFIG_PATH,
});

let mainWindow = null;

appInit().then((window) => {
  mainWindow = window
});

////////////////////////////////////////// dialog \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("message-box", async (event, options) => {
  return dialog.showMessageBoxSync(mainWindow, options);
});

////////////////////////////////////////// handle Relay Manager \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

backendManager.setRlyManagerEvtCbk(sendRlyManagerMessage);

function sendRlyManagerMessage(message) {
  mainWindow.webContents.send("relayjs:message", message);
}

ipcMain.handle("relayjs:connect", async (event, data) => {
  return await backendManager.rlyManagerConnect(data);
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
  return backendManager.rlyManagerGetRelay(relay);
});

ipcMain.handle("relayjs:getrelays", (event, data) => {
  return backendManager.rlyManagerGetRelays();
});

////////////////////////////////////////// handle Usb detection \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

backendManager.setUsbDetectionEvtCbk(sendUsbDetectionMessage);

function sendUsbDetectionMessage(devices) {
  const portItems = devices.map((device) => {
    return {
      label: device.port,
      click: () => onClickMenuItem(["Settings", "Port", device.port]),
    };
  });
  appMenu.updateTemplateItem(mainWindow, ["Settings", "Port"], {
    label: "Port",
    submenu: [
      {
        label: "Auto",
        click: () => onClickMenuItem(["Settings", "Port", "Auto"]),
      },
      ...portItems,
    ],
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

ipcMain.handle("app:getsettings", async (event, data) => {
  return await backendManager.appGetConfig(APP_SETTINGS_PATH);
});

ipcMain.handle("app:savesettings", async (event, data) => {
  await backendManager.appSaveConfig(APP_SETTINGS_PATH, data);
});

////////////////////////////////////////// handle extras \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("dom:loaded", async (event, jsonObj) => {
  appMenu.createTemplate(app, mainWindow, onClickMenuItem);

  const devices = await backendManager.usbDetectionGetDevices();

  const portItems = devices.map((device) => {
    return {
      type: "radio",
      label: device.port,
      checked: false,
      click: () => onClickMenuItem(["Settings", "Port", device.port]),
    };
  });

  appMenu.updateTemplateItem(mainWindow, ["Settings", "Port"], {
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
});

function onClickMenuItem(tree) {
  mainWindow.webContents.send("menu:action", tree);
}

ipcMain.handle(
  "app:saveconfig",
  async (event, { showSaveDialog = false, data = {} } = {}) => {
    let filePath = undefined;
    if (showSaveDialog) {
      filePath = saveDialog({ window: mainWindow });
      if (!filePath) {
        return true;
      }
    }
    await backendManager.appSaveConfig({ path: filePath, json: data });
    return true;
  }
);

ipcMain.handle("app:openconfig", async (event, filter) => {
  let config = {};
  const filePath = openDialog({ window: mainWindow });
  if (filePath) {
    config = await backendManager.appGetConfig(filePath);
  }
  return config;
});
