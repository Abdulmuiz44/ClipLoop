import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The Next.js backend that handles auth + API calls
const API_BACKEND = "https://app.cliploop.site";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "framer-motion": path.resolve(__dirname, "node_modules/framer-motion/dist/cjs/index.js"),
    },
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
