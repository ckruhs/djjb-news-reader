// This is a custom service worker script to handle feed URL requests differently

// Wait for the service worker to be installed and activated
self.addEventListener('install', event => {
  console.log('[Custom SW] Service worker installed');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', event => {
  console.log('[Custom SW] Service worker activated');
  event.waitUntil(self.clients.claim()); // Take control immediately
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Check if this is a request for our RSS feed
  if (url.pathname.endsWith('index.rss')) {
    console.log('[Custom SW] Intercepted feed request:', url.pathname);
    
    // For feed requests, we'll try caches first, then network, then offline handling
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Custom SW] Serving feed from cache');
            return cachedResponse;
          }
          
          // No cache, try network - but provide a fallback for offline
          return fetch(event.request)
            .then(response => {
              // Cache the successful response for future offline use
              const responseToCache = response.clone();
              caches.open('feed-cache').then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Custom SW] Cached feed response for offline use');
              });
              return response;
            })
            .catch(error => {
              console.log('[Custom SW] Network error fetching feed, using offline fallback');
              
              // Return a basic response that the app can handle
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: 'You are offline. Please check your connection.'
                }),
                {
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    
    // Prevent default service worker handling
    return;
  }
  
  // For all other requests, let the default Angular service worker handle them
  // by not calling event.respondWith()
});