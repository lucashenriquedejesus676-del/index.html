const CACHE_NAME = 'task-manager-v1';
const urlsToCache = [
  './',
  './task_manager.html',
  './manifest.json'
];

// Evento de instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento de ativação do Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Cache deletado:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de fetch: Cache first, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrou no cache, retorna
        if (response) {
          return response;
        }
        
        // Caso contrário, faz requisição à rede
        return fetch(event.request).then(response => {
          // Não cacheia requisições não-GET
          if (!event.request.method === 'GET') {
            return response;
          }
          
          // Clona a resposta
          const responseToCache = response.clone();
          
          // Cacheia a resposta
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Se offline, retorna página de offline (ou pode customizar)
        return new Response(
          'Você está offline. O app funcionará com os dados salvos localmente.',
          {
            status: 503,
            statusText: 'Serviço Indisponível',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=UTF-8'
            })
          }
        );
      })
  );
});
