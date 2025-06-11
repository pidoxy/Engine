"use client";

import { useEffect } from 'react';

export default function PWAHelper() {
  useEffect(() => {
    // Only run this in the browser
    if (typeof window !== 'undefined') {
      console.log('🔍 PWA Helper: Checking service worker support...');
      
      if ('serviceWorker' in navigator) {
        console.log('✅ Service Worker supported');
        
        // Check if service worker is already registered
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log('📋 Current service worker registrations:', registrations.length);
          registrations.forEach((registration, index) => {
            console.log(`📌 Registration ${index + 1}:`, {
              scope: registration.scope,
              state: registration.active?.state,
              scriptURL: registration.active?.scriptURL
            });
          });
        });

        // Listen for service worker events
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service worker controller changed');
          // Force refresh cache check after controller change
          setTimeout(() => {
            checkCacheStorage();
          }, 1000);
        });

        // Check if we have a controlling service worker
        if (navigator.serviceWorker.controller) {
          console.log('👷 Service worker is controlling this page:', navigator.serviceWorker.controller.scriptURL);
        } else {
          console.log('⚠️ No service worker controlling this page');
        }

        // Register service worker manually if needed (next-pwa should handle this)
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(registration => {
            console.log('✅ Service worker registration successful:', registration.scope);
            
            // Wait for service worker to activate then check cache
            if (registration.active) {
              setTimeout(() => {
                checkCacheStorage();
                forceCacheCurrentPage();
              }, 2000);
            }
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              console.log('🆕 Service worker update found');
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  console.log('🔄 New service worker state:', newWorker.state);
                  if (newWorker.state === 'activated') {
                    setTimeout(() => {
                      checkCacheStorage();
                    }, 1000);
                  }
                });
              }
            });
          })
          .catch(error => {
            console.error('❌ Service worker registration failed:', error);
          });

        // Function to check cache storage
        const checkCacheStorage = () => {
          if ('caches' in window) {
            caches.keys().then(cacheNames => {
              console.log('📦 Available caches:', cacheNames);
              if (cacheNames.length === 0) {
                console.log('⚠️ No caches found - this might be due to precaching errors');
                console.log('💡 Trying to manually cache current page...');
                forceCacheCurrentPage();
              } else {
                cacheNames.forEach(cacheName => {
                  caches.open(cacheName).then(cache => {
                    cache.keys().then(requests => {
                      console.log(`📦 Cache "${cacheName}" contains ${requests.length} entries`);
                    });
                  });
                });
              }
            });
          }
        };

        // Function to force cache current page resources
        const forceCacheCurrentPage = () => {
          if ('caches' in window) {
            caches.open('manual-cache').then(cache => {
              const urlsToCache = [
                window.location.href,
                '/',
                '/manifest.json',
                '/icons/icon-192x192.png',
                '/icons/icon-512x512.png'
              ];
              
              console.log('🔧 Manually caching essential resources...');
              return Promise.all(
                urlsToCache.map(url => {
                  return cache.add(url).catch(err => {
                    console.log(`⚠️ Failed to cache ${url}:`, err.message);
                  });
                })
              );
            }).then(() => {
              console.log('✅ Manual caching completed');
              setTimeout(checkCacheStorage, 500);
            }).catch(err => {
              console.error('❌ Manual caching failed:', err);
            });
          }
        };

        // Initial cache check
        setTimeout(checkCacheStorage, 1000);

      } else {
        console.error('❌ Service Worker not supported');
      }

      // Check if app is running as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      if (isStandalone || isFullscreen || isMinimalUI) {
        console.log('📱 App is running as PWA in standalone mode');
      } else if (window.navigator.standalone === true) {
        console.log('📱 App is running as PWA on iOS');
      } else {
        console.log('🌐 App is running in browser mode');
      }

      // Check for PWA install prompt
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 PWA install prompt available');
        e.preventDefault();
        deferredPrompt = e;
      });

      // Check online/offline status
      console.log('🌐 Online status:', navigator.onLine);
      window.addEventListener('online', () => {
        console.log('🌐 App came online');
      });
      window.addEventListener('offline', () => {
        console.log('📴 App went offline');
      });
    }
  }, []);

  return null; // This component doesn't render anything
} 