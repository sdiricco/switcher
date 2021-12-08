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
