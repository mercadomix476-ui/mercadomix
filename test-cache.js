// Script de teste para verificar o cache de produtos
import offlinePDVService from './src/services/offlinePDVService.js';

async function testCache() {
  try {
    console.log('🔄 Testando cache de produtos...');
    
    // Inicializar o serviço
    console.log('📦 Inicializando serviço...');
    await offlinePDVService.init();
    
    // Verificar estatísticas iniciais
    console.log('📊 Verificando estatísticas do cache...');
    const initialStats = await offlinePDVService.getCacheStats();
    console.log('Estatísticas iniciais:', initialStats);
    
    // Tentar atualizar o cache
    if (initialStats.isOnline) {
      console.log('🌐 Online - Tentando atualizar cache...');
      const result = await offlinePDVService.refreshProductCache();
      console.log('Resultado da atualização:', result);
      
      // Verificar estatísticas após atualização
      const updatedStats = await offlinePDVService.getCacheStats();
      console.log('Estatísticas após atualização:', updatedStats);
    } else {
      console.log('📱 Offline - Pulando atualização do cache');
    }
    
    // Testar busca offline
    console.log('🔍 Testando busca offline...');
    const searchResults = await offlinePDVService.searchProductsOffline('', { limit: 5 });
    console.log(`Encontrados ${searchResults.length} produtos no cache`);
    
    if (searchResults.length > 0) {
      console.log('Exemplo de produto:', searchResults[0]);
    }
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCache();