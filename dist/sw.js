// Service Worker para funcionalidade offline
const CACHE_NAME = 'nexus-commerce-v1';
const STATIC_CACHE = 'nexus-static-v1';
const DATA_CACHE = 'nexus-data-v1';

// Arquivos para cache estático
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.jsx',
  '/src/index.css'
];

// URLs da API para cache de dados
const API_URLS = [
  '/api/products',
  '/api/settings',
  '/api/categories'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      // Cache de arquivos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Cacheando arquivos estáticos');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Pular waiting para ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia para arquivos estáticos: Cache First
  if (STATIC_FILES.some(file => url.pathname.includes(file))) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }
  
  // Estratégia para API: Network First com fallback para cache
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a resposta for bem-sucedida, cache ela
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar (offline), tenta buscar do cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            
            // Se não tiver no cache, retorna resposta offline
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Dados não disponíveis offline',
                offline: true 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }
  
  // Para outros requests, usar estratégia padrão
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background Sync para sincronização quando voltar online
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales());
  }
  
  if (event.tag === 'sync-stock') {
    event.waitUntil(syncPendingStock());
  }
});

// Sincronizar vendas pendentes
async function syncPendingSales() {
  try {
    console.log('Service Worker: Sincronizando vendas pendentes...');
    
    // Buscar vendas pendentes do IndexedDB
    const pendingSales = await getPendingSales();
    
    for (const sale of pendingSales) {
      try {
        // Tentar enviar para o servidor
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale.data)
        });
        
        if (response.ok) {
          // Se sucesso, remover da fila local
          await removePendingSale(sale.id);
          console.log('Service Worker: Venda sincronizada:', sale.id);
        }
      } catch (error) {
        console.error('Service Worker: Erro ao sincronizar venda:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Erro na sincronização de vendas:', error);
  }
}

// Sincronizar movimentações de estoque pendentes
async function syncPendingStock() {
  try {
    console.log('Service Worker: Sincronizando estoque pendente...');
    
    const pendingStock = await getPendingStock();
    
    for (const stock of pendingStock) {
      try {
        const response = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stock.data)
        });
        
        if (response.ok) {
          await removePendingStock(stock.id);
          console.log('Service Worker: Estoque sincronizado:', stock.id);
        }
      } catch (error) {
        console.error('Service Worker: Erro ao sincronizar estoque:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Erro na sincronização de estoque:', error);
  }
}

// Funções auxiliares para IndexedDB (implementar conforme necessário)
async function getPendingSales() {
  // Implementar busca no IndexedDB
  return [];
}

async function removePendingSale(id) {
  // Implementar remoção do IndexedDB
}

async function getPendingStock() {
  // Implementar busca no IndexedDB
  return [];
}

async function removePendingStock(id) {
  // Implementar remoção do IndexedDB
}