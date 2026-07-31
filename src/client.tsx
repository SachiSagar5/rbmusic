import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !navigator.userAgent.includes("Electron")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/rbmusic/sw.js").catch(() => {});
  });
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}
