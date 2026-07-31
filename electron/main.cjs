const { app, BrowserWindow, shell } = require("electron");
const http = require("http");
const path = require("path");
const fs = require("fs");

const DIST = path.join(__dirname, "..", "dist");
const BASE = "/rbmusic";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".nojekyll": "text/plain; charset=utf-8",
};

function contentType(p) {
  return MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
}

function createServer() {
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    let rel = pathname;
    if (rel.startsWith(BASE)) rel = rel.slice(BASE.length);
    if (rel === "" || rel === "/") rel = "/index.html";

    const filePath = path.normalize(path.join(DIST, rel));
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(DIST, "index.html"), (fallbackErr, html) => {
          if (fallbackErr) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
          res.end(html);
        });
        return;
      }
      res.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  });
}

let server;

function startServer() {
  return new Promise((resolve, reject) => {
    server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function createWindow(port) {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "RB Music",
    backgroundColor: "#06030e",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      if (url.startsWith("http")) shell.openExternal(url);
    }
  });

  await win.loadURL(`http://127.0.0.1:${port}${BASE}/`);
  return win;
}

app.setName("RB Music");

app.whenReady().then(async () => {
  const port = await startServer();
  await createWindow(port);

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(port);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
