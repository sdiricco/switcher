const { dialog } = require("electron");

function saveDialog({
  window = null,
  json = {},
  title = "Save",
  buttonLabel = "Save",
  filters = ["json"],
  options = undefined,
} = {}) {

  let filePath = undefined;
  let __options = undefined;

  if (options !== undefined) {
    __options = options;
  }
  else{
    __options = {
      title: title,
      buttonLabel: buttonLabel,
      defaultPath: ".json",
      filters: [{name: "json", extensions: filters}]
    }
  }
  
  try {
    filePath = dialog.showSaveDialogSync(window, __options);
  } catch (e) {
    throw(e)
  }

  return filePath;
}

function openDialog({
  
}){

}

module.exports = { saveDialog }
