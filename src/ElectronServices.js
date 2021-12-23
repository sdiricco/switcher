const { ipcRenderer } = window.require("electron");

async function appOpenConfig({ openFromExplorer = false }) {
  return await ipcRenderer.invoke("app:openconfig", {
    openFromExplorer: openFromExplorer,
  });
}

async function appSetTitle(title = "") {
  return await ipcRenderer.invoke("app:settitle", title);
}

async function appSaveConfig(config) {
  return await ipcRenderer.invoke("app:saveconfig", {
    showSaveDialog: false,
    data: config,
  });
}
async function appSaveAsConfig(config) {
  return await ipcRenderer.invoke("app:saveconfig", {
    showSaveDialog: true,
    data: config,
  });
}

async function menuUpdatePortList(devices = []) {
  return await ipcRenderer.invoke("menu:port:update", devices);
}

async function relayWrite(pin = 0, value = 0){
    return await ipcRenderer.invoke("relayjs:write", pin, value);
}

export { appOpenConfig, appSetTitle, appSaveConfig, appSaveAsConfig, menuUpdatePortList, relayWrite };
