# 📱 Guia Completo: Cache de Produtos Offline

## 🎯 Objetivo
Permitir que os produtos do Supabase (banco online) sejam armazenados no IndexedDB (cache offline) para uso quando não há conexão com a internet.

## 🔧 Como Funciona

### 1. **Fluxo de Sincronização**
```
Supabase (Online) → OfflinePDVService → IndexedDB (Offline)
     ↓                      ↓                    ↓
  Produtos reais      Processamento        Cache local
```

### 2. **Componentes Implementados**

#### 🔹 **OfflinePDVService** (Serviço Principal)
- **Localização**: `src/services/offlinePDVService.js`
- **Função**: Gerencia toda a sincronização entre Supabase e IndexedDB
- **Métodos principais**:
  - `refreshProductCache()` - Sincroniza todos os produtos
  - `getCacheStats()` - Retorna estatísticas do cache
  - `searchProductsOffline()` - Busca produtos no cache

#### 🔹 **ProductCacheManager** (Interface de Administração)
- **Localização**: `src/components/admin/ProductCacheManager.jsx`
- **Função**: Interface completa para gerenciar o cache
- **Recursos**:
  - Visualizar estatísticas do cache
  - Sincronizar produtos manualmente
  - Limpar cache
  - Monitorar progresso

#### 🔹 **SyncProductsButton** (Botão Rápido)
- **Localização**: `src/components/ui/sync-products-button.jsx`
- **Função**: Botão simples para sincronizar em qualquer lugar
- **Variações**:
  - Botão completo com texto
  - Botão apenas com ícone

#### 🔹 **useProductSync** (Hook de Gerenciamento)
- **Localização**: `src/hooks/useProductSync.js`
- **Função**: Hook para usar em componentes React
- **Recursos**:
  - Estados de sincronização
  - Funções de sync e limpeza
  - Monitoramento automático

## 🚀 Como Usar

### **Opção 1: Interface Completa de Administração**

```jsx
import ProductCacheManager from '@/components/admin/ProductCacheManager';

function AdminPage() {
  return (
    <div>
      <h1>Administração</h1>
      <ProductCacheManager />
    </div>
  );
}
```

### **Opção 2: Botão Simples**

```jsx
import { SyncProductsButton } from '@/components/ui/sync-products-button';

function Header() {
  return (
    <div className="flex items-center gap-2">
      <h1>PDV</h1>
      <SyncProductsButton 
        variant="outline"
        onSuccess={(result) => console.log('Sincronizado!', result)}
      />
    </div>
  );
}
```

### **Opção 3: Hook Personalizado**

```jsx
import { useProductSync } from '@/hooks/useProductSync';

function MyComponent() {
  const { 
    syncProducts, 
    isSyncing, 
    productCount, 
    lastSync,
    canSync 
  } = useProductSync();

  return (
    <div>
      <p>Produtos no cache: {productCount}</p>
      <p>Última sync: {lastSync?.toLocaleString()}</p>
      
      <button 
        onClick={() => syncProducts()}
        disabled={!canSync}
      >
        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  );
}
```

### **Opção 4: Uso Direto do Serviço**

```javascript
import offlinePDVService from '@/services/offlinePDVService';

// Sincronizar produtos
const result = await offlinePDVService.refreshProductCache();
if (result.success) {
  console.log(`${result.productCount} produtos sincronizados!`);
}

// Buscar no cache
const produtos = await offlinePDVService.searchProductsOffline('coca', { limit: 10 });
console.log('Produtos encontrados:', produtos);

// Verificar estatísticas
const stats = await offlinePDVService.getCacheStats();
console.log('Cache stats:', stats);
```

## 📋 Funcionalidades Principais

### ✅ **Sincronização Automática**
- Inicializa cache automaticamente na primeira execução
- Sincroniza a cada 30 minutos quando online
- Auto-sincroniza quando volta a ficar online

### ✅ **Sincronização Manual**
- Botões para sincronizar quando necessário
- Interface de administração completa
- Feedback visual com progresso

### ✅ **Busca Offline**
- Busca por nome, SKU, código de barras
- Busca fuzzy (aproximada)
- Resultados limitados e ordenados por relevância

### ✅ **Monitoramento**
- Status online/offline
- Estatísticas do cache (quantidade, tamanho, última sync)
- Detecção de problemas no cache

### ✅ **Gerenciamento**
- Limpar cache
- Reconstruir cache
- Verificar integridade

## 🔄 Fluxo de Uso Típico

### **1. Primeira Execução**
```
1. Usuário abre a aplicação
2. OfflinePDVService.init() é chamado automaticamente
3. Se online e cache vazio → sincroniza automaticamente
4. Produtos ficam disponíveis para busca offline
```

### **2. Uso Normal**
```
1. Usuário busca produtos no PDV
2. Se online → busca no servidor + cache
3. Se offline → busca apenas no cache
4. Sincronização automática a cada 30min
```

### **3. Administração**
```
1. Admin acessa ProductCacheManager
2. Visualiza estatísticas do cache
3. Pode sincronizar manualmente
4. Pode limpar cache se necessário
```

## 🛠️ Configurações

### **Personalizar Intervalo de Sincronização**
```javascript
// No OfflinePDVService.js, linha ~750
setInterval(() => {
  this.periodicCacheSync();
}, 30 * 60 * 1000); // 30 minutos (pode alterar)
```

### **Personalizar Tamanho do Lote**
```javascript
// No método cacheAllProducts(), linha ~730
const itemsPerPage = 100; // Produtos por lote (pode alterar)
```

### **Personalizar Limite de Cache**
```javascript
// No método clearExpiredCache(), linha ~596
async clearExpiredCache(maxSizeMB = 50) // Tamanho máximo (pode alterar)
```

## 🚨 Solução de Problemas

### **Cache Vazio**
```javascript
// Verificar se há produtos no Supabase
const { data } = await supabaseService.Product.list({ page: 1, itemsPerPage: 1 });
console.log('Produtos no servidor:', data);

// Forçar sincronização
await offlinePDVService.refreshProductCache();
```

### **Erro de Sincronização**
```javascript
// Limpar e reconstruir cache
await offlinePDVService.rebuildCache();
await offlinePDVService.refreshProductCache();
```

### **Cache Corrompido**
```javascript
// Verificar integridade
const integrity = await offlinePDVService.validateCacheIntegrity();
if (!integrity.isValid) {
  await offlinePDVService.rebuildCache();
}
```

## 📊 Monitoramento

### **Verificar Status**
```javascript
const stats = await offlinePDVService.getCacheStats();
console.log({
  produtos: stats.productCount,
  tamanho: stats.cacheSizeMB + ' MB',
  ultimaSync: stats.lastFullSync,
  online: stats.isOnline
});
```

### **Logs Importantes**
- `"Caching all products for offline mode..."` - Início da sincronização
- `"All products cached for offline mode (X products)"` - Sincronização concluída
- `"Search completed in Xms"` - Busca realizada
- `"Cache sync completed at: ..."` - Sincronização periódica

## 🎉 Pronto para Usar!

O sistema está completamente implementado e pronto para uso. Os produtos do Supabase serão automaticamente sincronizados para o cache IndexedDB, permitindo busca offline no PDV.

### **Para Testar:**
1. Abra a aplicação
2. Verifique se há produtos no cache (deve sincronizar automaticamente)
3. Desconecte a internet
4. Teste a busca de produtos no PDV
5. Os produtos devem aparecer mesmo offline! 🎯