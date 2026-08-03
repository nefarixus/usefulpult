const { app, BrowserWindow, Tray, Menu, screen, session, nativeImage, ipcMain, clipboard } = require("electron");
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

// Serves the static-exported Next.js app ("out/") over real HTTP instead
// of file://. Loading a Next export via file:// is known to be fragile —
// asset resolution, various web APIs (clipboard, some fetch edge cases)
// treat file:// as a restricted/null origin, and behavior can vary by
// Windows install path or asar quirks. A tiny local HTTP server sidesteps
// all of that and behaves exactly like `npm run electron:dev` does
// (which has always worked reliably), just serving pre-built files
// instead of a live dev server.
function startLocalServer(outDir) {
  return new Promise((resolve, reject) => {
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
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      localServer = server;
      resolve(server.address().port);
    });
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

async function createWindow() {
  const { height } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 380;
  const winHeight = 560;
  currentPos = { x: 40, y: Math.max(20, height - winHeight - 40) };

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: winWidth,
    minHeight: 420,
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
    { label: "Проверить обновления", click: () => checkForUpdates() },
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

// electron-updater only works against a real packaged build published to
// GitHub Releases (see the "publish" field in package.json) — in dev it
// throws, so this is a no-op unless app.isPackaged.
function checkForUpdates() {
  if (!app.isPackaged) {
    console.log("[pult] автообновление пропущено — сборка не запакована.");
    return;
  }
  autoUpdater.checkForUpdates().catch((e) => {
    console.warn("[pult] проверка обновлений не удалась:", e.message);
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.on("update-available", (info) => {
    console.log("[pult] найдено обновление:", info.version);
  });
  autoUpdater.on("update-not-available", () => {
    console.log("[pult] обновлений нет — используется последняя версия.");
  });
  autoUpdater.on("error", (err) => {
    console.warn("[pult] ошибка автообновления:", err.message);
  });
  autoUpdater.on("update-downloaded", (info) => {
    console.log("[pult] обновление скачано:", info.version, "— установится при следующем запуске.");
  });
  checkForUpdates();
  // Recheck periodically for anyone who leaves the app running for a while.
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
}

app.whenReady().then(async () => {
  await createWindow();
  createTray();
  setupAutoUpdater();

  ipcMain.handle("get-window-position", () => [currentPos.x, currentPos.y]);
  ipcMain.on("set-window-position", (_e, x, y) => {
    if (!mainWindow) return;
    currentPos = { x: Math.round(x), y: Math.round(y) };
    mainWindow.setPosition(currentPos.x, currentPos.y);
  });

  ipcMain.handle("get-autostart", () => app.getLoginItemSettings().openAtLogin);
  ipcMain.on("set-autostart", (_e, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled });
  });

  ipcMain.on("copy-text", (_e, text) => {
    clipboard.writeText(String(text ?? ""));
  });
});

app.on("window-all-closed", () => {
  if (localServer) localServer.close();
  if (process.platform !== "darwin") app.quit();
});
