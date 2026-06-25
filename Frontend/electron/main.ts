import pkg from "electron";
import path from "path";
import { fileURLToPath } from "url";

const { app, BrowserWindow, ipcMain } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenu(null);
  win.loadURL("http://localhost:5173");
};

app.whenReady().then(() => {
  createWindow();

  ipcMain.on("message", (_, message) => {
    console.log("Message from React:", message);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});