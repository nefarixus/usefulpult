const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pult", {
  getWindowPosition: () => ipcRenderer.invoke("get-window-position"),
  setWindowPosition: (x, y) => ipcRenderer.send("set-window-position", x, y),
  getAutostart: () => ipcRenderer.invoke("get-autostart"),
  setAutostart: (enabled) => ipcRenderer.send("set-autostart", enabled),
  copyText: (text) => ipcRenderer.send("copy-text", text),
  setWindowOpacity: (value) => ipcRenderer.send("set-window-opacity", value),
  getAcrylicEnabled: () => ipcRenderer.invoke("get-acrylic-enabled"),
  setAcrylicEnabled: (enabled) => ipcRenderer.send("set-acrylic-enabled", enabled),
});
