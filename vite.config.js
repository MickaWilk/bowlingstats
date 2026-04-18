import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["icons/*.png"],
    manifest: {
      name: "BowlingStats",
      short_name: "BowlingStats",
      description: "Suis ta progression au bowling",
      theme_color: "#0a0a18",
      background_color: "#0a0a18",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "supabase-api",
            expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
          }
        }
      ]
    }
  }), cloudflare()]
});