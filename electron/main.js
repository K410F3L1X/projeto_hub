"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const net = __importStar(require("net"));
// Next.js server imports
const next = require("next");
let mainWindow = null;
let tray = null;
let nextApp = null;
let serverHandle = null;
let isQuitting = false;
const isDev = process.env.NODE_ENV !== "production";
const APP_PORT = 3000;
const NEXT_DIR = isDev ? process.cwd() : path.join(process.resourcesPath, "app");
// Ensure single instance
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
electron_1.app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
    }
});
async function isPortInUse(port) {
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
async function startNextServer() {
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
function createTray() {
    // Create a simple 16x16 icon programmatically (violet square)
    const icon = electron_1.nativeImage.createEmpty();
    tray = new electron_1.Tray(icon.isEmpty() ? electron_1.nativeImage.createFromBuffer(createTrayIcon()) : icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
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
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip("Study Hub — Segundo Cérebro");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
        if (mainWindow?.isVisible()) {
            mainWindow.hide();
        }
        else {
            mainWindow?.show();
            mainWindow?.focus();
        }
    });
}
function createTrayIcon() {
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
                pixels[idx] = 124; // R (violet)
                pixels[idx + 1] = 58; // G
                pixels[idx + 2] = 237; // B
                pixels[idx + 3] = 255; // A
            }
            else {
                pixels[idx + 3] = 0; // Transparent
            }
        }
    }
    return electron_1.nativeImage.createFromBuffer(pixels, { width: size, height: size }).toPNG();
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
        electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
}
// App lifecycle
electron_1.app.on("before-quit", () => {
    isQuitting = true;
});
electron_1.app.whenReady().then(async () => {
    // Register IPC handlers for window controls
    electron_1.ipcMain.handle("get-app-version", () => electron_1.app.getVersion());
    electron_1.ipcMain.on("window-minimize", () => mainWindow?.minimize());
    electron_1.ipcMain.on("window-maximize", () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.on("window-close", () => mainWindow?.close());
    try {
        await startNextServer();
    }
    catch (err) {
        console.error("Failed to start Next.js server:", err);
    }
    createWindow();
    createTray();
});
electron_1.app.on("window-all-closed", () => {
    // Don't quit — keep in tray
});
electron_1.app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
    else {
        mainWindow.show();
    }
});
