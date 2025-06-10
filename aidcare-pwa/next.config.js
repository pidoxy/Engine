const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,         // Register the service worker
  skipWaiting: true,      // Install new service worker immediately
  runtimeCaching: [       // Optional: Define custom runtime caching strategies
    {
      urlPattern: /^https?.*/, // Cache API calls, images, etc.
      handler: 'NetworkFirst', // Or 'CacheFirst', 'StaleWhileRevalidate'
      options: {
        cacheName: 'runtime-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
        cacheableResponse: {
          statuses: [0, 200], // Cache opaque responses and successful ones
        },
      },
    },
  ],
  disable: process.env.NODE_ENV === 'development' // Disable PWA in dev for easier debugging
});

module.exports = withPWA({
  reactStrictMode: true,
});