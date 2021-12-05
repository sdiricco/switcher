const { RelayJs } = require("@sdiricco/relayjs");

let sendRlyState = (e) => {
  mainWindow.webContents.send("relayjs-updatestate", error, rlyState);
};

//connect
ipcMain.handle("relayjs:connect", async (event, data) => {

});

//connect
ipcMain.handle("relayjs:disconnect", async (event, data) => {

});

ipcMain.handle("relayjs:write", async (event, relay, value) => {

});

ipcMain.handle("relayjs:getstate", (event, data) => {
  return __rlyState();
});

ipcMain.handle("relayjs:getrelay", (event, relay) => {
  return relayjs.relays[relay];
});

ipcMain.handle("relayjs:getrelays", (event, data) => {
});

