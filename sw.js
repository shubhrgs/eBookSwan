// sw.js — epubReaderPro PWA Service Worker
const CACHE_NAME = 'epubreader-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js'
];

// Install: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-only for external APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Dictionary API: network-only (dynamic, small responses)
  if (url.hostname === 'api.dictionaryapi.dev') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // CDN libraries & app files: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => 
      cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
    )
  );
});