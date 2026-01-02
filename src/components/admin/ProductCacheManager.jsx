import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Wifi,
  WifiOff,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import offlinePDVService from '@/services/offlinePDVService';
import { toast } from 'sonner';

/**
 * Componente para gerenciar o cache de produtos offline
 * Permite sincronizar produtos do Supabase para o IndexedDB
 */
export default function ProductCacheManager() {
  const [cacheStats, setCacheStats] = useState({
    productCount: 0,
    cacheSizeMB: 0,
    lastFullSync: null,
    lastPartialSync: null,
    isOnline: navigator.onLine
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState(''); // 'sync', 'clear', 'init'
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Atualizar estatísticas do cache
  const updateStats = async () => {
    try {
      const stats = await offlinePDVService.getCacheStats();
      setCacheStats(stats);
      setError(null);
    } catch (err) {
      console.error('Erro ao atualizar estatísticas:', err);
      setError(err.message);
    }
  };

  // Sincronizar todos os produtos do Supabase para o cache
  const syncAllProducts = async () => {
    if (!navigator.onLine) {
      toast.error('Sem conexão com a internet');
      return;
    }

    setIsLoading(true);
    setOperation('sync');
    setProgress(0);
    setError(null);

    try {
      toast.info('Iniciando sincronização...', {
        description: 'Buscando produtos do servidor',
        duration: 3000
      });

      // Simular progresso durante a sincronização
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await offlinePDVService.refreshProductCache();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        await updateStats();
        toast.success('Sincronização concluída!', {
          description: result.message,
          duration: 5000
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Erro na sincronização:', err);
      setError(err.message);
      toast.error('Erro na sincronização', {
        description: err.message,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
      setOperation('');
      setProgress(0);
    }
  };

  // Limpar todo o cache
  const clearCache = async () => {
    setIsLoading(true);
    setOperation('clear');
    setError(null);

    try {
      await offlinePDVService.rebuildCache();
      await updateStats();
      
      toast.success('Cache limpo com sucesso!', {
        description: 'Todos os produtos foram removidos do cache',
        duration: 3000
      });
    } catch (err) {
      console.error('Erro ao limpar cache:', err);
      setError(err.message);
      toast.error('Erro ao limpar cache', {
        description: err.message,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
      setOperation('');
    }
  };

  // Inicializar cache (primeira vez)
  const initializeCache = async () => {
    if (!navigator.onLine) {
      toast.error('Sem conexão com a internet');
      return;
    }

    setIsLoading(true);
    setOperation('init');
    setProgress(0);
    setError(null);

    try {
      toast.info('Inicializando cache...', {
        description: 'Configurando cache pela primeira vez',
        duration: 3000
      });

      await offlinePDVService.init();
      
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      const result = await offlinePDVService.refreshProductCache();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        await updateStats();
        toast.success('Cache inicializado!', {
          description: `${result.productCount} produtos foram carregados`,
          duration: 5000
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Erro na inicialização:', err);
      setError(err.message);
      toast.error('Erro na inicialização', {
        description: err.message,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
      setOperation('');
      setProgress(0);
    }
  };

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setCacheStats(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setCacheStats(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar estatísticas iniciais
  useEffect(() => {
    updateStats();
  }, []);

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (!cacheStats.isOnline && cacheStats.productCount === 0) return 'text-red-600';
    if (!cacheStats.isOnline && cacheStats.productCount > 0) return 'text-orange-600';
    if (cacheStats.isOnline && cacheStats.productCount > 0) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (error) return 'Erro no cache';
    if (!cacheStats.isOnline && cacheStats.productCount === 0) return 'Offline - Sem produtos';
    if (!cacheStats.isOnline && cacheStats.productCount > 0) return 'Offline - Cache disponível';
    if (cacheStats.isOnline && cacheStats.productCount > 0) return 'Online - Cache atualizado';
    return 'Online - Cache vazio';
  };

  const getStatusIcon = () => {
    if (error) return AlertTriangle;
    if (!cacheStats.isOnline) return WifiOff;
    if (cacheStats.productCount > 0) return CheckCircle;
    return Wifi;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Cache</h2>
          <p className="text-gray-600">Sincronize produtos do servidor para uso offline</p>
        </div>
        
        <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-2`}>
          <StatusIcon className="w-4 h-4" />
          {getStatusText()}
        </Badge>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Status do Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cacheStats.productCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Produtos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {cacheStats.cacheSizeMB.toFixed(1)} MB
              </div>
              <div className="text-sm text-gray-600">Tamanho</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {cacheStats.isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="text-sm text-gray-600">Conexão</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {cacheStats.lastFullSync ? 
                  new Date(cacheStats.lastFullSync).toLocaleDateString() : 
                  'Nunca'
                }
              </div>
              <div className="text-sm text-gray-600">Última Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {operation === 'sync' && 'Sincronizando produtos...'}
                  {operation === 'clear' && 'Limpando cache...'}
                  {operation === 'init' && 'Inicializando cache...'}
                </span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sincronizar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="w-5 h-5" />
              Sincronizar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Baixa todos os produtos do servidor para o cache local
            </p>
            <Button 
              onClick={syncAllProducts}
              disabled={isLoading || !cacheStats.isOnline}
              className="w-full"
            >
              {isLoading && operation === 'sync' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Sincronizar Produtos
            </Button>
          </CardContent>
        </Card>

        {/* Atualizar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="w-5 h-5" />
              Atualizar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Atualiza produtos existentes no cache
            </p>
            <Button 
              onClick={syncAllProducts}
              disabled={isLoading || !cacheStats.isOnline || cacheStats.productCount === 0}
              variant="outline"
              className="w-full"
            >
              {isLoading && operation === 'sync' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar Cache
            </Button>
          </CardContent>
        </Card>

        {/* Limpar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="w-5 h-5" />
              Limpar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Remove todos os produtos do cache local
            </p>
            <Button 
              onClick={clearCache}
              disabled={isLoading || cacheStats.productCount === 0}
              variant="destructive"
              className="w-full"
            >
              {isLoading && operation === 'clear' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Limpar Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {!cacheStats.isOnline && (
        <Alert>
          <WifiOff className="w-4 h-4" />
          <AlertDescription>
            Você está offline. Para sincronizar produtos, conecte-se à internet.
          </AlertDescription>
        </Alert>
      )}

      {cacheStats.productCount === 0 && cacheStats.isOnline && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            O cache está vazio. Clique em "Sincronizar Produtos" para baixar os produtos do servidor.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Erro:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como funciona:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Sincronizar:</strong> Baixa todos os produtos do Supabase para o cache local</li>
                <li>• <strong>Atualizar:</strong> Atualiza produtos existentes com dados mais recentes</li>
                <li>• <strong>Limpar:</strong> Remove todos os produtos do cache (útil para resolver problemas)</li>
                <li>• O cache permite buscar produtos mesmo quando offline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}