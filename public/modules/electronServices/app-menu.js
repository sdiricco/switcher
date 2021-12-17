////////////////////////////////////// Global Requires \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
const { Menu } = require("electron");
const R = require("ramda");

////////////////////////////////////// Global Constants \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
const isMac = process.platform === "darwin";

////////////////////////////////////// Global Variables \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
let defaultTemplate = [];
let template = [];

////////////////////////////////////// Global Functions \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
function buildMenuFromTemplate(window, template) {
  const menu = Menu.buildFromTemplate(template);
  window.setMenu(menu);
}

function createTemplate(app, window, onClickItem) {
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
          click: () => onClickItem(["File", "Open"]),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "Ctrl + S",
          click: () => onClickItem(["File", "Save"]),
        },
        {
          label: "Save as..",
          accelerator: "Ctrl + Shift + S",
          click: () => onClickItem(["File", "Save as.."]),
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
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "minimize" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ type: "separator" }, { role: "close" }]),
      ],
    },
    {
      label: "Settings",
      submenu: [
        {
          type: "checkbox",
          label: "Autosave",
          checked: true,
        },
        {
          label: "Port",
          submenu: [
            {
              label: "Auto",
              click: () => onClickItem(["Settings", "Port", "Auto"]),
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
          click: () => onClickItem(["help", "Learn More"]),
        },
      ],
    },
  ];
  template = R.clone(__template);
  defaultTemplate = R.clone(__template);
  buildMenuFromTemplate(window, template);
}

function updateTemplateItem(window, tree, content, __template) {
  if (__template === undefined) {
    __template = template;
  }
  if (tree.length === 1) {
    const label = tree[0];
    for (let i = 0; i < __template.length; i++) {
      if (__template[i].label === label) {
        __template[i] = content;
        return true;
      }
    }
  } else {
    const label = tree[0];
    for (let i = 0; i < __template.length; i++) {
      if (__template[i].label === label) {
        tree.shift();
        updateTemplateItem(window, tree, content, __template[i].submenu);
        buildMenuFromTemplate(window, template);
      }
    }
  }
}

////////////////////////////////////// Exports \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
module.exports = { updateTemplateItem, createTemplate };
