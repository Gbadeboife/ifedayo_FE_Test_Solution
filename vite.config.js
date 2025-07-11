import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  build: {
    chunkSizeWarningLimit: 1600,
    outDir: 'dist',
    commonjsOptions: {
      defaultIsModuleExports(id) {
        if (/react-google-autocomplete/.test(id)) return false;
        return "auto";
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  }
});
