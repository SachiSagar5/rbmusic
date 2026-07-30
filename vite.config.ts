import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/rbmusic/",
  tanstackStart: {
    server: { entry: "server" },
  },
});
