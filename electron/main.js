const { app, BrowserWindow, Tray, Menu, screen, session, nativeImage, ipcMain, clipboard, Notification, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const http = require("http");
const fs = require("fs");

let koffi = null;
try {
  koffi = require("koffi");
} catch (e) {
  koffi = null;
}

let mainWindow = null;
let tray = null;
// Disabled by default: reparenting the window into the desktop's WorkerW
// makes it render behind the icons, but on at least one machine it also
// broke click hit-testing on buttons (rendering and input routing are
// separate subsystems in Windows, and this trick only officially handles
// rendering). A normal floating frameless window is a better trade-off
// than a desktop-glued window where buttons don't reliably respond.
let pinnedToDesktop = false;
// Electron's own getPosition() can report stale/wrong coordinates once
// the window has been reparented via native SetParent (Chromium's widget
// isn't aware that happened). So instead of ever reading position back
// from Electron, we track it ourselves and treat it as the source of
// truth — every setPosition call we make updates this too.
let currentPos = { x: 40, y: 20 };
let currentSize = { width: 440, height: 560 };
let localServer = null;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

// Fixed ports (with fallbacks) instead of a random one — the browser
// scopes localStorage to host+port, so a random port every launch was
// silently wiping every setting (theme, language, checklist, clocks...)
// on every restart, since each run got treated as a brand new origin.
const PREFERRED_PORTS = [47837, 47838, 47839, 0];

function startLocalServer(outDir) {
  return new Promise((resolve, reject) => {
    function tryPort(i) {
      const port = PREFERRED_PORTS[i];
      const server = http.createServer((req, res) => {
        try {
          let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
          if (urlPath === "/") urlPath = "/index.html";
          const safePath = path.normalize(path.join(outDir, urlPath));
          if (!safePath.startsWith(path.normalize(outDir))) {
            res.writeHead(403);
            res.end("Forbidden");
            return;
          }
          fs.readFile(safePath, (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end("Not found");
              return;
            }
            const ext = path.extname(safePath).toLowerCase();
            res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
            res.end(data);
          });
        } catch (e) {
          res.writeHead(500);
          res.end("Server error");
        }
      });
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE" && i + 1 < PREFERRED_PORTS.length) {
          tryPort(i + 1);
        } else {
          reject(err);
        }
      });
      server.listen(port, "127.0.0.1", () => {
        localServer = server;
        resolve(server.address().port);
      });
    }
    tryPort(0);
  });
}

function createTrayIcon() {
  // A small amber house glyph, drawn pixel-by-pixel in memory — no icon
  // file needed. Rendered at 32x32 then downscaled to 16x16 for a
  // crisper result than drawing straight at tray resolution.
  const size = 32;
  const buffer = Buffer.alloc(size * size * 4);

  const amber = [0xe3, 0xa9, 0x55, 0xff];
  const door = [0x1b, 0x18, 0x15, 0xff]; // matches the app's dark background

  function setPixel(x, y, color) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    buffer[i] = color[0];
    buffer[i + 1] = color[1];
    buffer[i + 2] = color[2];
    buffer[i + 3] = color[3];
  }

  // Roof: triangle from apex down to the top of the body.
  const apexX = 16;
  const apexY = 5;
  const roofBottomY = 15;
  const roofHalfWidth = 11;
  for (let y = apexY; y <= roofBottomY; y++) {
    const t = (y - apexY) / (roofBottomY - apexY);
    const half = Math.round(t * roofHalfWidth);
    for (let x = apexX - half; x <= apexX + half; x++) setPixel(x, y, amber);
  }

  // Body.
  for (let y = roofBottomY; y <= 27; y++) {
    for (let x = 9; x <= 23; x++) setPixel(x, y, amber);
  }

  // Door cutout.
  for (let y = 19; y <= 27; y++) {
    for (let x = 14; x <= 18; x++) setPixel(x, y, door);
  }

  return nativeImage
    .createFromBuffer(buffer, { width: size, height: size })
    .resize({ width: 16, height: 16, quality: "best" });
}

const stateFilePath = path.join(app.getPath("userData"), "window-state.json");
const MIN_WIDTH = 440;
const MIN_HEIGHT = 420;

function loadWindowState() {
  try {
    const raw = fs.readFileSync(stateFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  } catch (e) {
    // no saved state yet, or file is corrupt — just fall back to default
  }
  return null;
}

function currentState() {
  return { x: currentPos.x, y: currentPos.y, width: currentSize.width, height: currentSize.height };
}

let saveStateTimer = null;
function saveWindowState() {
  if (saveStateTimer) clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => {
    saveStateTimer = null;
    try {
      fs.writeFileSync(stateFilePath, JSON.stringify(currentState()));
    } catch (e) {
      console.warn("[pult] не удалось сохранить состояние окна:", e.message);
    }
  }, 300);
}

function flushWindowStateNow() {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer);
    saveStateTimer = null;
  }
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(currentState()));
  } catch (e) {
    // best effort — nothing more we can do on the way out
  }
}

function clampToScreen(pos, winWidth, winHeight, screenWidth, screenHeight) {
  return {
    x: Math.min(Math.max(pos.x, 0), Math.max(0, screenWidth - winWidth)),
    y: Math.min(Math.max(pos.y, 0), Math.max(0, screenHeight - winHeight)),
  };
}

async function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const defaultWidth = 440;
  const defaultHeight = 560;

  const saved = loadWindowState();
  currentSize = saved
    ? {
        width: Math.max(MIN_WIDTH, Math.min(saved.width || defaultWidth, screenWidth)),
        height: Math.max(MIN_HEIGHT, Math.min(saved.height || defaultHeight, screenHeight)),
      }
    : { width: defaultWidth, height: defaultHeight };

  currentPos = saved
    ? clampToScreen(saved, currentSize.width, currentSize.height, screenWidth, screenHeight)
    : { x: 40, y: Math.max(20, screenHeight - currentSize.height - 40) };

  mainWindow = new BrowserWindow({
    width: currentSize.width,
    height: currentSize.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    x: currentPos.x,
    y: currentPos.y,
    frame: false,
    transparent: false,
    backgroundColor: "#1b1815",
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.on("move", () => {
    const [x, y] = mainWindow.getPosition();
    currentPos = { x, y };
    saveWindowState();
  });
  mainWindow.on("resize", () => {
    const [w, h] = mainWindow.getSize();
    currentSize = { width: w, height: h };
    saveWindowState();
  });

  let startUrl = process.env.ELECTRON_START_URL;
  if (!startUrl) {
    const outDir = path.join(__dirname, "../out");
    const port = await startLocalServer(outDir);
    startUrl = `http://127.0.0.1:${port}/index.html`;
  }
  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (pinnedToDesktop) embedIntoDesktop();
  });

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "geolocation");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("show", () => tray && rebuildTrayMenu());
  mainWindow.on("hide", () => tray && rebuildTrayMenu());
}

function toHex(h) {
  if (h === null || h === undefined) return "null";
  try {
    return "0x" + (typeof h === "bigint" ? h.toString(16) : Number(h).toString(16));
  } catch {
    return String(h);
  }
}

// The classic "wallpaper engine" trick: reparent our window into the
// WorkerW that Windows Explorer keeps behind the desktop icons.
// This relies on undocumented Explorer behavior that has changed shape
// across Windows versions, so this tries a few known layouts in order
// and logs each step to the console (run via `npm run electron:dev` in
// a terminal to see it) if this doesn't work on your machine.
//
// All handles are typed as uintptr_t (a plain integer), not void* —
// koffi returns void* as an opaque pointer object that can't be
// compared or logged directly, which is what caused the earlier
// "Cannot convert object to primitive value" error.
function embedIntoDesktop() {
  if (!koffi || !mainWindow) {
    console.warn("[pult] koffi недоступен — окно останется обычным.");
    return;
  }
  try {
    const user32 = koffi.load("user32.dll");
    const FindWindowA = user32.func(
      "uintptr_t __stdcall FindWindowA(str lpClassName, str lpWindowName)"
    );
    const FindWindowExA = user32.func(
      "uintptr_t __stdcall FindWindowExA(uintptr_t hwndParent, uintptr_t hwndChildAfter, str lpszClass, str lpszWindow)"
    );
    const SendMessageTimeoutA = user32.func(
      "intptr_t __stdcall SendMessageTimeoutA(uintptr_t hWnd, uint32_t Msg, uintptr_t wParam, uintptr_t lParam, uint32_t fuFlags, uint32_t uTimeout, uintptr_t lpdwResult)"
    );
    const SetParent = user32.func(
      "uintptr_t __stdcall SetParent(uintptr_t hWndChild, uintptr_t hWndNewParent)"
    );

    const progman = FindWindowA("Progman", null);
    console.log("[pult] Progman:", toHex(progman));
    if (!progman) {
      console.warn("[pult] не нашёл окно Progman.");
      return;
    }

    SendMessageTimeoutA(progman, 0x052c, 0, 0, 0x0, 1000, 0);
    SendMessageTimeoutA(progman, 0x052c, 0, 0, 0x0, 1000, 0);

    setTimeout(() => {
      try {
        // List every top-level WorkerW for diagnostics.
        const allWorkerW = [];
        let w = FindWindowExA(0, 0, "WorkerW", null);
        let guard = 0;
        while (w && guard < 50) {
          allWorkerW.push(w);
          w = FindWindowExA(0, w, "WorkerW", null);
          guard++;
        }
        console.log(
          "[pult] найдено WorkerW верхнего уровня:",
          allWorkerW.length,
          allWorkerW.map(toHex).join(", ")
        );

        let target = null;
        let strategy = "";

        // Strategy A: SHELLDLL_DefView sits directly under Progman
        // (common on recent Windows 11 builds). Target = the WorkerW
        // right after Progman in z-order, or Progman itself if there
        // is none.
        const defviewUnderProgman = FindWindowExA(progman, 0, "SHELLDLL_DefView", null);
        console.log("[pult] SHELLDLL_DefView под Progman:", toHex(defviewUnderProgman));
        if (defviewUnderProgman) {
          const afterProgman = FindWindowExA(0, progman, "WorkerW", null);
          target = afterProgman || progman;
          strategy = afterProgman ? "A: WorkerW после Progman" : "A: сам Progman (WorkerW не найден)";
        } else {
          // Strategy B/C: find the WorkerW that hosts SHELLDLL_DefView,
          // then target either the *next* WorkerW after it (classic
          // layout) or that same WorkerW if there's no next one (some
          // newer builds keep everything in a single WorkerW).
          for (const candidate of allWorkerW) {
            const hosted = FindWindowExA(candidate, 0, "SHELLDLL_DefView", null);
            if (hosted) {
              const next = FindWindowExA(0, candidate, "WorkerW", null);
              target = next || candidate;
              strategy = next ? "B: WorkerW после хоста DefView" : "C: сам WorkerW-хост DefView";
              break;
            }
          }
        }

        // Last resort: if nothing matched but at least one WorkerW
        // exists, just use the first one.
        if (!target && allWorkerW.length > 0) {
          target = allWorkerW[0];
          strategy = "D: первый попавшийся WorkerW";
        }

        console.log("[pult] выбранная стратегия:", strategy || "(нет)", "target:", toHex(target));

        if (!target || !mainWindow) {
          console.warn("[pult] не нашёл подходящее окно для встраивания — окно останется обычным.");
          return;
        }

        const handleBuffer = mainWindow.getNativeWindowHandle();
        const hwndValue =
          process.arch === "x64" || process.arch === "arm64"
            ? handleBuffer.readBigUInt64LE(0)
            : handleBuffer.readUInt32LE(0);
        console.log("[pult] hwnd нашего окна:", toHex(hwndValue));

        const result = SetParent(hwndValue, target);
        console.log("[pult] SetParent вернул:", toHex(result));

        // Reparenting can silently shift where the window actually ends
        // up on screen. Re-assert our last known-good position right
        // after, so our internal tracking (currentPos) stays true —
        // this is what fixed the "jumps on first drag" bug.
        if (mainWindow) {
          mainWindow.setPosition(currentPos.x, currentPos.y);
        }
      } catch (innerErr) {
        console.warn("[pult] ошибка при встраивании в рабочий стол:", innerErr.message);
      }
    }, 150);
  } catch (err) {
    console.warn("[pult] не удалось встроить окно в рабочий стол:", err.message);
  }
}
function rebuildTrayMenu() {
  const isVisible = mainWindow ? mainWindow.isVisible() : false;
  const menu = Menu.buildFromTemplate([
    {
      label: isVisible ? "Скрыть" : "Показать",
      click: () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
      },
    },
    { type: "separator" },
    { label: "Проверить обновления", click: () => checkForUpdates(true) },
    { type: "separator" },
    { label: "Выход", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Домашний пульт");
  rebuildTrayMenu();
  tray.on("click", () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
}

function notify(title, body) {
  if (!Notification.isSupported()) {
    console.log(`[pult] (уведомления не поддерживаются) ${title}: ${body}`);
    return;
  }
  new Notification({ title, body }).show();
}

function showDialog(opts) {
  // Windows toast notifications can silently fail to appear for unsigned
  // apps depending on system settings — a modal dialog always renders,
  // so this is what manual "Проверить обновления" clicks use to
  // guarantee the person actually sees a result.
  dialog.showMessageBox(mainWindow || undefined, {
    type: "info",
    title: "Домашний пульт",
    buttons: ["OK"],
    ...opts,
  });
}

let lastCheckWasManual = false;

// electron-updater only works against a real packaged build published to
// GitHub Releases (see the "publish" field in package.json) — in dev it
// throws, so this is a no-op unless app.isPackaged. `manual` controls
// whether we show a dialog even when there's nothing new — a packaged
// app has no visible console, so without this a manual click on
// "Проверить обновления" can look like it does nothing at all.
function checkForUpdates(manual = false) {
  lastCheckWasManual = manual;
  if (!app.isPackaged) {
    console.log("[pult] автообновление пропущено — сборка не запакована.");
    if (manual) {
      showDialog({ message: "Проверка обновлений недоступна в режиме разработки." });
    }
    return;
  }
  autoUpdater.checkForUpdates().catch((e) => {
    console.warn("[pult] проверка обновлений не удалась:", e.message);
    if (manual) {
      showDialog({
        type: "error",
        message: "Не удалось проверить обновления",
        detail: e.message,
      });
    }
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  console.log("[pult] текущая версия:", app.getVersion());
  try {
    console.log("[pult] feed URL:", JSON.stringify(autoUpdater.getFeedURL?.()));
  } catch (e) {
    console.log("[pult] не удалось получить feed URL:", e.message);
  }

  autoUpdater.on("update-available", (info) => {
    console.log("[pult] найдено обновление:", info.version);
    if (lastCheckWasManual) {
      showDialog({
        message: `Найдена версия ${info.version}`,
        detail: "Скачивается в фоне, установится при следующем запуске.",
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[pult] обновлений нет — используется последняя версия.");
    if (lastCheckWasManual) {
      showDialog({
        message: "У тебя уже последняя версия",
        detail: `Установлена: ${app.getVersion()}`,
      });
    }
  });

  autoUpdater.on("error", (err) => {
    console.warn("[pult] ошибка автообновления:", err.message);
    if (lastCheckWasManual) {
      showDialog({ type: "error", message: "Ошибка автообновления", detail: err.message });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[pult] обновление скачано:", info.version, "— установится при следующем запуске.");
    dialog
      .showMessageBox(mainWindow || undefined, {
        type: "info",
        title: "Домашний пульт",
        message: `Версия ${info.version} скачана`,
        detail: "Установить сейчас или при следующем запуске?",
        buttons: ["Перезапустить сейчас", "Позже"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
  });

  checkForUpdates(false);
  // Recheck periodically for anyone who leaves the app running for a while.
  setInterval(() => checkForUpdates(false), 4 * 60 * 60 * 1000);
}

app.setAppUserModelId("com.homepult.app");

app.whenReady().then(async () => {
  await createWindow();
  createTray();
  setupAutoUpdater();

  ipcMain.handle("get-window-position", () => [currentPos.x, currentPos.y]);
  ipcMain.on("set-window-position", (_e, x, y) => {
    if (!mainWindow) return;
    mainWindow.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.handle("get-autostart", () => app.getLoginItemSettings().openAtLogin);
  ipcMain.on("set-autostart", (_e, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled });
  });

  ipcMain.on("copy-text", (_e, text) => {
    clipboard.writeText(String(text ?? ""));
  });
});

app.on("before-quit", () => {
  flushWindowStateNow();
});

app.on("window-all-closed", () => {
  flushWindowStateNow();
  if (localServer) localServer.close();
  if (process.platform !== "darwin") app.quit();
});
