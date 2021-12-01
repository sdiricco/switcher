const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  ipcRenderer,
  Menu,
} = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { RelayJs } = require("@sdiricco/relayjs");
const {
  existsFile,
  loadJSON,
  saveJSON,
  getUsbDevices,
} = require("./modules/utils/utils");
const usbDetect = require("usb-detection");
const fs = require("fs");
const contextMenu = require("electron-context-menu");

contextMenu({
  prepend: (defaultActions, parameters, browserWindow) => [
    {
      label: "Rainbow",
      // Only show it when right-clicking images
      visible: parameters.mediaType === "image",
    },
    {
      label: "Search Google for “{selection}”",
      // Only show it when right-clicking text
      visible: parameters.selectionText.trim().length > 0,
      click: () => {
        shell.openExternal(
          `https://google.com/search?q=${encodeURIComponent(
            parameters.selectionText
          )}`
        );
      },
    },
  ],
});

const isReloaded = false;
let mainWindow = null;
let menu = null;
const gotTheLock = app.requestSingleInstanceLock();
const APP_PATH = app.getPath("appData");
const APP_CONFIG_PATH = path.join(APP_PATH, "relayjs-data", "config.json");
const RELAY_MODULE = 1;
const isMac = process.platform === "darwin";
const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  // { role: 'fileMenu' }
  {
    label: "File",
    submenu: [
      {
        label: "Open",
        click: onMenuFileOpen,
      },
      { type: "separator" },
      {
        label: "Save",
        accelerator: "Ctrl + S",
        click: onMenuFileSave,
      },
      {
        label: "Save as..",
        accelerator: "Ctrl + Shift + S",
        click: onMenuFileSaveAs,
      },
      { type: "separator" },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  },
  // { role: 'editMenu' }
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      ...(isMac
        ? [
            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
            { type: "separator" },
            {
              label: "Speech",
              submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
            },
          ]
        : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
    ],
  },
  // { role: 'viewMenu' }
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [
            { type: "separator" },
            { role: "front" },
            { type: "separator" },
            { role: "window" },
          ]
        : [{ role: "close" }]),
    ],
  },
  {
    label: "Settings",
    submenu: [
      { type: "checkbox", label: "Autosave", checked: true },
      {
        label: "Port",
        submenu: [
          {
            label: "Auto",
            click: () => {
              mainWindow.webContents.send("port:change", "Auto");
            },
          },
        ],
      },
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
      },
    ],
  },
];

function onMenuFileOpen() {
  console.log("before open");
  if (!mainWindow) {
    return;
  }
  console.log("open");
  mainWindow.webContents.send("menu:file:open", true);
}

function onMenuFileSave() {
  console.log("before save");
  if (!mainWindow) {
    return;
  }
  console.log("save");

  mainWindow.webContents.send("menu:file:save", true);
}

function onMenuFileSaveAs() {
  console.log("before save as");
  if (!mainWindow) {
    return;
  }
  console.log("save as");
  mainWindow.webContents.send("menu:file:saveas", true);
}

function updateMenuTemplate(devices) {
  const usbitems = devices.map((device) => {
    return {
      label: device.port,
      click: () => {
        mainWindow.webContents.send("port:change", device.port);
      },
    };
  });

  const items = [
    {
      label: "Auto",
      click: () => {
        mainWindow.webContents.send("port:change", "Auto");
      },
    },
    ...usbitems,
  ];

  const fileIdx = template.findIndex((el) => el.label === "Settings");
  if (fileIdx < 0 || !template[fileIdx].submenu) {
    return;
  }
  const portIdx = template[fileIdx].submenu.findIndex(
    (el) => el.label === "Port"
  );
  template[fileIdx].submenu[portIdx].submenu = items;
  const menu = Menu.buildFromTemplate(template);
  mainWindow.setMenu(menu);
}

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
    autoHideMenuBar: true,
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
  /* mainWindow.removeMenu(); */

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

////////////////////////////////////////// utils \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

usbDetect.startMonitoring();
usbDetect.on("change", async () => {
  const devices = await getUsbDevices();
  updateMenuTemplate(devices);
});

ipcMain.handle("utils:get-usb-devices", async (event, data) => {
  const devices = await getUsbDevices();
  return devices;
});

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
  return res;
});

ipcMain.handle("utils:save-app-conf", async (event, jsonObj) => {
  const ret = {
    success: false,
    error: "",
    data: {},
  };
  try {
    await saveJSON(APP_CONFIG_PATH, jsonObj);
    ret.success = true;
  } catch (e) {
    ret.success = false;
    ret.error = e.message;
  }
  return ret;
});

ipcMain.handle("dom:loaded", async (event, jsonObj) => {
  const devices = await getUsbDevices();
  updateMenuTemplate(devices);
  mainWindow.autoHideMenuBar = false;
  mainWindow.menuBarVisible = true;
});

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

ipcMain.handle("utils:saveas-custom-app-config", async (event) => {
  var options = {
    title: "Save app config",
    defaultPath: "config",
    buttonLabel: "Save",

    filters: [{ name: "json", extensions: ["json"] }],
  };
  try {
    dialog.showSaveDialog(null, options).then(({ filePath }) => {
      fs.writeFileSync(filePath, "hello world", "utf-8");
    });

    if (result !== undefined) {
      return result[0];
    }
  } catch (e) {}

  return "";
});
