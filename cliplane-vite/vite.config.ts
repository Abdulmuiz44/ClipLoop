import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const API_BACKEND = "https://app.cliplane.site";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "framer-motion": path.resolve(__dirname, "node_modules/framer-motion/dist/cjs/index.js"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
        },
      },
    },
    minify: "esbuild",
    sourcemap: false,
    target: "es2020",
  },
  server: {
    proxy: {
      "/api": {
        target: API_BACKEND,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
