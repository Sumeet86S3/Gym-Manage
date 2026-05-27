// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    nitro(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      outDir: ".output/public",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-192.png",
        "icons/icon-maskable-512.png",
      ],
      manifest: {
        name: "FitSphere",
        short_name: "FitSphere",
        description: "Role-based fitness studio management for admins, trainers, and clients.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#1599a3",
        background_color: "#f8fafb",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cacheId: "fitsphere-pwa",
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}"],
        navigateFallback: "/",
        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/auth(?:\/|$)/,
          /^\/health(?:\/|$)/,
          /^\/uploads(?:\/|$)/,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              (/^\/api(?:\/|$)/.test(url.pathname) ||
                /^\/auth(?:\/|$)/.test(url.pathname) ||
                /\/auth\//.test(url.pathname)),
            handler: "NetworkOnly",
            method: "GET",
            options: {
              cacheName: "fitsphere-api-network-only",
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              (/^\/api(?:\/|$)/.test(url.pathname) ||
                /^\/auth(?:\/|$)/.test(url.pathname) ||
                /\/auth\//.test(url.pathname)),
            handler: "NetworkOnly",
            method: "POST",
            options: {
              cacheName: "fitsphere-api-network-only",
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              /^\/assets\/.+\.(?:js|css|woff2?|png|svg|webp|jpe?g)$/.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fitsphere-static-assets-v1",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              /\.(?:png|svg|webp|jpe?g|gif|avif|ico)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "fitsphere-images-v1",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" ||
              url.origin === "https://fonts.gstatic.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fitsphere-fonts-v1",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
