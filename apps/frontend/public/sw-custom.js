// Custom Service Worker additions
// This will be merged with the auto-generated sw.js by next-pwa

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip problematic URLs that cause infinite refresh
  const shouldSkip = 
    url.protocol === 'chrome-extension:' ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('_next/webpack-hmr') ||
    url.pathname.includes('__nextjs') ||
    url.search.includes('_rsc=');
  
  if (shouldSkip) {
    return;
  }
});

// Clear old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Clear old workbox caches
            return cacheName.startsWith('workbox-');
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

