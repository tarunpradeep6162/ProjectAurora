import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
  ],

  server: {
    host: "0.0.0.0",
    port: 5173,

    hmr: {
      host: "3.209.17.214",
      protocol: "ws",
      clientPort: 5173,
    },
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
