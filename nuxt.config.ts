// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  devServer: {
    https: true
  },
  
  modules: [
    '@vite-pwa/nuxt'
  ],
  
  vite: {
    plugins: []
  },
  
  pwa: {
    registerType: 'autoUpdate',
    // 移除 workbox 中的 injectManifest
    workbox: {
      navigateFallback: '/offline.html',
      globPatterns: ['**/*.{js,html,png,svg,ico}'],
      // iPhone Safari 相容性設定
      clientsClaim: true,
      skipWaiting: true,
      cleanupOutdatedCaches: true,

      // 快取策略
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.(js|png|jpg|jpeg|svg|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 天
            }
          }
        },
        // 新增專門的 CSS 快取策略
        {
          urlPattern: /^https:\/\/.*\.css$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'css-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 天
            }
          }
        },
        {
          urlPattern: /^https:\/\/.*\/api\/.*$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5 // 5 分鐘
            }
          }
        },
        // 快取主頁面
        {
          urlPattern: /^https:\/\/.*\/$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 // 1 天
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module'
    },
    manifest: {
      name: 'PWA 離線檔案暫存系統',
      short_name: '檔案暫存',
      description: '支援離線檔案暫存與自動上傳的 PWA 應用',
      theme_color: '#4f46e5',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        }
      ]
    }
  },
  
  app: {
    head: {
      title: 'PWA 離線檔案暫存系統',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: '支援離線檔案暫存與自動上傳的 PWA 應用' },
        { name: 'theme-color', content: '#4f46e5' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '檔案暫存' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-TileColor', content: '#4f46e5' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-touch-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '167x167', href: '/apple-touch-icon-167x167.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#4f46e5' }
      ]
    }
  }
})
