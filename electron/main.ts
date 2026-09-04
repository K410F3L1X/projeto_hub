import { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain } from "electron";
import * as path from "path";
import * as http from "http";
import * as net from "net";

// Next.js server imports
const next = require("next");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let nextApp: any = null;
let serverHandle: http.Server | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV !== "production";
const APP_PORT = 3000;
const NEXT_DIR = isDev ? process.cwd() : path.join(process.resourcesPath, "app");

// Ensure single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function startNextServer(): Promise<void> {
  const portInUse = await isPortInUse(APP_PORT);
  if (portInUse) {
    console.log(`Port ${APP_PORT} already in use, connecting to existing server...`);
    return;
  }

  nextApp = next({
    dev: isDev,
    dir: NEXT_DIR,
    port: APP_PORT,
  });

  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  serverHandle = http.createServer((req, res) => {
    handle(req, res);
  });

  serverHandle.listen(APP_PORT, () => {
    console.log(`Next.js server running on http://localhost:${APP_PORT}`);
  });
}

function createTray(): void {
  // Create a simple 16x16 icon programmatically (violet square)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon.isEmpty() ? nativeImage.createFromBuffer(createTrayIcon()) : icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir Study Hub",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Dashboard",
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(`http://localhost:${APP_PORT}/dashboard`);
      },
    },
    {
      label: "Inbox",
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(`http://localhost:${APP_PORT}/inbox`);
      },
    },
    {
      label: "Busca",
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(`http://localhost:${APP_PORT}/search`);
      },
    },
    { type: "separator" },
    {
      label: "Sair",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Study Hub — Segundo Cérebro");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function createTrayIcon(): Buffer {
  // Create a simple 16x16 PNG icon (violet circle)
  // This is a minimal valid PNG with a violet pixel pattern
  const size = 16;
  const channels = 4; // RGBA

  // Create raw pixel data
  const pixels = Buffer.alloc(size * size * channels);
  const cx = size / 2;
  const cy = size / 2;
  const radius = 6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * channels;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        pixels[idx] = 124;     // R (violet)
        pixels[idx + 1] = 58;  // G
        pixels[idx + 2] = 237; // B
        pixels[idx + 3] = 255; // A
      } else {
        pixels[idx + 3] = 0; // Transparent
      }
    }
  }

  return nativeImage.createFromBuffer(
    pixels,
    { width: size, height: size }
  ).toPNG();
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0f",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${APP_PORT}`);

  // Show when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

// App lifecycle
app.on("before-quit", () => {
  isQuitting = true;
});

app.whenReady().then(async () => {
  // Register IPC handlers for window controls
  ipcMain.handle("get-app-version", () => app.getVersion());
  ipcMain.on("window-minimize", () => mainWindow?.minimize());
  ipcMain.on("window-maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on("window-close", () => mainWindow?.close());

  try {
    await startNextServer();
  } catch (err) {
    console.error("Failed to start Next.js server:", err);
  }

  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  // Don't quit — keep in tray
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
