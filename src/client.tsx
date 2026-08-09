import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http") &&
  !navigator.userAgent.includes("Electron")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/rbmusic/sw.js").catch(() => {});
  });
}

function renderApp() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

const root = document.getElementById("root");
if (root) {
  // Client-only SPA build (GitHub Pages / Electron): #root is present in the static HTML
  createRoot(root).render(renderApp());
} else {
  // SSR (TanStack Start dev/server): the shell renders the full <html> document with no #root,
  // so resolve the initial route and hydrate the whole document.
  router.ssr = { manifest: undefined };
  void router.load().then(() => hydrateRoot(document, renderApp()));
}
