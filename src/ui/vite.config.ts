import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import path from 'path';

const uiRoot = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = path.resolve(uiRoot, "..", "..");

export default defineConfig({
  root: uiRoot, // <-- make 'ui/' the Vite project root
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["vue"],
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
    allowedHosts: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // make sure Rollup knows the entry html is under ui/
    rollupOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
    },
  },
});
