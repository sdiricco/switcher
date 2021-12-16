const { app, BrowserWindow } = require("electron");
const gotTheLock = app.requestSingleInstanceLock();
const isDev = require("electron-is-dev");


let mainWindow = null;

async function appInit() {
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });

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
      if (BrowserWindow.getAllWindows().length === 0) __createWindow();
    });
  }

  await app.whenReady();

  const window = __createWindow();

  return window;
}

function __createWindow() {
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

  return mainWindow;
}


module.exports = {appInit}