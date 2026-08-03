const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pult", {
  getWindowPosition: () => ipcRenderer.invoke("get-window-position"),
  setWindowPosition: (x, y) => ipcRenderer.send("set-window-position", x, y),
  getAutostart: () => ipcRenderer.invoke("get-autostart"),
  setAutostart: (enabled) => ipcRenderer.send("set-autostart", enabled),
  copyText: (text) => ipcRenderer.send("copy-text", text),
});
