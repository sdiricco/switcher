const path = require("path");
const { app, ipcMain, dialog } = require("electron");
const appMenu = require("./modules/electronServices/app-menu");
const { BackendManager } = require("./modules/backendManager");
const { appInit } = require("./modules/electronServices/app-init");

require("./modules/electronServices/app-context-menu");

const APP_PATH = app.getPath("appData");
const APP_SETTINGS_PATH = path.join(APP_PATH, "relay-app-settings.json");
const APP_CONFIG_PATH = path.join(APP_PATH, "relay-app-config.json");

let mainWindow = null;

appInit().then((window) => {
  mainWindow = window
});

const backendManager = new BackendManager({
  appSettingsPath: APP_SETTINGS_PATH,
  appConfigPath: APP_CONFIG_PATH,
});

////////////////////////////////////////// dialog \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("message-box", async (event, options) => {
  return dialog.showMessageBoxSync(mainWindow, options);
});

////////////////////////////////////////// dom loaded \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("dom:loaded", async (event, jsonObj) => {
  appMenu.createTemplate(app, mainWindow, onClickMenuItem);

  const devices = await backendManager.usbDetectionGetDevices();
  updateMenuPortItems(devices);

});

////////////////////////////////////////// handle Relay Manager \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

backendManager.setRlyManagerEvtCbk(sendRlyManagerMessage);

function sendRlyManagerMessage(message) {
  mainWindow.webContents.send("relayjs:message", message);
}

ipcMain.handle("relayjs:connect", async (event, {port = undefined, size = undefined, options = undefined} = {}) => {
  return await backendManager.rlyManagerConnect({
    port: port,
    size: size,
    options: options,
  });
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
  mainWindow.webContents.send("usbdetection:update", devices);
}

ipcMain.handle("usbdetection:getdevices", async (event, data) => {
  return await backendManager.usbDetectionGetDevices();
});


////////////////////////////////////////// handle menu \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function onClickMenuItem(tree) {
  mainWindow.webContents.send("menu:action", tree);
}

////////////////////////////////////////// handle app \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

ipcMain.handle("app:settitle", async (event, title) => {
  mainWindow.setTitle(title)
});

ipcMain.handle(
  "app:saveconfig",
  async (event, { showSaveDialog = false, data = {} } = {}) => {
    let filePath = undefined;
    if (showSaveDialog) {
      filePath = dialog.showSaveDialogSync(mainWindow, {
        title: "Save",
        buttonLabel: "Save",
        defaultPath: ".json",
        filters: [{name: "json", extensions: filters}]
      });
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
  const listOfFilePath = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openFile"],
    filters: [{name: "json", extensions: ["json"]}]
  });
  const filePath = listOfFilePath[0];
  if (filePath) {
    config = await backendManager.appGetConfig(filePath);
  }
  return {
    config: config,
    path: filePath
  };
});

ipcMain.handle("menu:port:update", async (event, devices) =>{
  updateMenuPortItems(devices);
})


////////////////////////////////////////// aux functions \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function updateMenuPortItems(devices){
  console.log(devices)
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
}