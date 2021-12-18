const { ipcRenderer } = window.require("electron");

async function appOpenConfig({openFromExplorer = false}){
    return await ipcRenderer.invoke("app:openconfig", {
        openFromExplorer: openFromExplorer,
    });
}

async function appSetTitle(title = ""){
    return await ipcRenderer.invoke("app:settitle", title);
}

module.exports = {appOpenConfig, appSetTitle}