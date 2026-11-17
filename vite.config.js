import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        site: fileURLToPath(new URL("./index.html", import.meta.url)),
        gestao: fileURLToPath(new URL("./gestao/index.html", import.meta.url)),
      },
    },
  },
});
