import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/assets": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"],
      buildBase: "/",
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "Astikan Employee App",
        short_name: "Astikan",
        description: "Employee wellness companion for assessments, health tracking, and support.",
        lang: "en-US",
        id: "/",
        start_url: "/",
        scope: "/",
        categories: ["health", "medical", "productivity"],
        prefer_related_applications: false,
        theme_color: "#6d5cff",
        background_color: "#ffffff",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone"],
        orientation: "portrait",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ],
        shortcuts: [
          { name: "Home", short_name: "Home", url: "/home" },
          { name: "Health", short_name: "Health", url: "/health" }
        ],
        screenshots: [
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", form_factor: "wide" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
        ]
      },
    })
  ]
})
