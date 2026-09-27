import { defineConfig } from "vite";

// The extension keeps its original layout in dist/: static files are
// copied verbatim from public/, and the two entry points build to the
// exact paths the manifest references (src/background.js and
// popup/script.js).
export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    target: "es2020",
    rollupOptions: {
      input: {
        "src/background": "src/background.ts",
        "popup/script": "src/popup.ts",
      },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
  },
});
