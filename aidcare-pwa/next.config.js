const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' // Disable PWA in dev
});

module.exports = withPWA({
  reactStrictMode: true,
  // Note: Using webpack for builds since next-pwa doesn't support Turbopack yet
});