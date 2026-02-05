const CACHE_NAME = 'todo-pwa-v70';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './sw.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './infinity-animation.css',
    './nikah-animation.css',
    './list-layout-refinement.css',
    './checkbox-animations.css',
    './home-refinements.css',
    './special-message-animations.css',
    './dark-mode-additions.css',
    './swipe-nav.css',
    './splash-design.css',
    './touch-drag-support.js',
    './image-viewer.js'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Force waiting SW to become active immediately (optional, but requested for updates)
    // self.skipWaiting(); -> We will handle this via user action instead for better UX
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event (Cache First, fallback to Network)
self.addEventListener('fetch', (event) => {
    // Firebase requests should go to network -> Use networkOnly or networkFirst for API
    if (event.request.url.includes('firestore') || event.request.url.includes('googleapis.com/auth')) {
        return; // Let browser handle it (Network only)
    }

    // Google Fonts are CORS enabled, cache them
    if (event.request.url.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request).then(response => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }

    // App Shell
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }
            // Otherwise fetch from network
            return fetch(event.request).catch(() => {
                // If offline and request is for navigation, return index.html (optionalSPA)
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// Listen for Skip Waiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
