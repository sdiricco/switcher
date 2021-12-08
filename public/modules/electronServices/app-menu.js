const isMac = process.platform === "darwin";
const R = require("ramda")

let defaultTemplate = [];
let template = []

function createMenuTemplate(app, onClickItem) {
  let __template = [
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
          click: () => onClickItem(["File", "Open"])
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "Ctrl + S",
          click: () => onClickItem(["File", "Save"])
        },
        {
          label: "Save as..",
          accelerator: "Ctrl + Shift + S",
          click: () => onClickItem(["File", "Save as.."])
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
              click: () => onClickItem(["Settings", "Port", "Auto"])
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
          click: () => onClickItem(["help", "Learn More"])
        },
      ],
    },
  ];
  template = R.clone(__template);
  defaultTemplate = R.clone(__template);
  return template;
}

function updateMenuItem(tree, content, __template){
  if (__template === undefined) {
    __template = template
  }
  if (tree.length === 1) {
    const label = tree[0];
    for(let i = 0; i < __template.length; i++){
      if(__template[i].label === label){
        __template[i] = content;
        return true;
      }
    }
  }
  else{
    const label = tree[0];
    for(let i = 0; i < __template.length; i++){
      if(__template[i].label === label){
        tree.shift();
        updateMenuItem(tree, content, __template[i].submenu);
        return template;
      }
    }
  }
}

module.exports = {updateMenuItem, createMenuTemplate}





