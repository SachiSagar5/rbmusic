import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  root: ".",
  base: "/rbmusic/",
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@tanstack/start-storage-context": path.resolve("src/browser-shims.ts"),
    },
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssMinify: true,
    rollupOptions: {
      input: "client-index.html",
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/") && id.includes("lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
  },
});
