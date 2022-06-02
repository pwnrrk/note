const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

contextBridge.exposeInMainWorld("api", {
  fs() {
    return fs;
  },
  path() {
    return path;
  },
  // importMarkdown() {
  //   return dialog.showOpenDialogSync(browserWindow, {
  //     defaultPath: "~",
  //     filters: ".md",
  //   });
  // },
});
