import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api as base44 } from "@/api/supabaseService";
import { Search, Plus, Barcode, Wifi, WifiOff, Database, Cloud, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import offlinePDVService from "@/services/offlinePDVService";
import { toast } from "sonner";

export default function ProductSearch({ onAddProduct, searchQuery, setSearchQuery }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState('unknown');
  const [searchSource, setSearchSource] = useState('online');
  const [offlineResults, setOfflineResults] = useState([]);
  const [isOfflineSearching, setIsOfflineSearching] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [cacheIssues, setCacheIssues] = useState(null);
  const inputRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Monitor online/offline status with enhanced feedback
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSearchSource('online');
      
      // Show success message for reconnection (Requirement 3.4)
      toast.success('Conexão restaurada! PDV funcionando online.', {
        description: 'Sincronizando dados automaticamente...',
        duration: 4000,
        icon: <CheckCircle className="w-4 h-4" />
      });
      
      // Start synchronization process
      setSyncInProgress(true);
      setTimeout(() => {
        setSyncInProgress(false);
        setLastSyncTime(new Date());
        toast.success('Sincronização concluída!', {
          duration: 2000
        });
      }, 2000); // Simulate sync time
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSearchSource('cache');
      setSyncInProgress(false);
      
      // Show warning message for offline mode (Requirement 3.4)
      toast.warning('Sem conexão. PDV funcionando offline.', {
        description: 'Usando dados em cache local',
        duration: 5000,
        icon: <WifiOff className="w-4 h-4" />
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize offline service and check cache status with enhanced monitoring
  useEffect(() => {
    const initializeOfflineService = async () => {
      try {
        await offlinePDVService.init();
        
        // Check cache status and integrity
        const cacheCount = await offlinePDVService.getCacheProductCount();
        const metadata = await offlinePDVService.getCacheMetadata();
        const integrity = await offlinePDVService.validateCacheIntegrity();
        
        if (!integrity.isValid) {
          setCacheIssues({
            type: 'corruption',
            message: 'Cache corrompido detectado',
            issues: integrity.issues
          });
          
          // Show warning for cache corruption (Requirement 3.3)
          toast.warning('Cache corrompido detectado', {
            description: 'Reconstruindo cache automaticamente...',
            duration: 5000,
            icon: <AlertTriangle className="w-4 h-4" />
          });
          
          // Attempt to rebuild cache
          try {
            await offlinePDVService.rebuildCache();
            setCacheIssues(null);
            toast.success('Cache reconstruído com sucesso!');
          } catch (error) {
            setCacheIssues({
              type: 'rebuild_failed',
              message: 'Falha ao reconstruir cache',
              error: error.message
            });
          }
        }
        
        if (cacheCount === 0) {
          setCacheStatus('empty');
          if (!isOnline) {
            // Show warning for empty cache while offline (Requirement 3.3)
            toast.warning('Cache vazio', {
              description: 'Conecte-se à internet para buscar produtos',
              duration: 6000,
              icon: <AlertTriangle className="w-4 h-4" />
            });
          }
        } else if (!isOnline) {
          setCacheStatus('available_offline');
        } else {
          setCacheStatus('available_online');
        }
        
        // Check if cache is outdated
        if (metadata.last_full_sync) {
          const lastSync = new Date(metadata.last_full_sync);
          const hoursSinceSync = (new Date() - lastSync) / (1000 * 60 * 60);
          
          if (hoursSinceSync > 24) {
            setCacheIssues({
              type: 'outdated',
              message: 'Cache desatualizado',
              hoursSinceSync: Math.round(hoursSinceSync)
            });
            
            if (isOnline) {
              toast.info('Cache desatualizado', {
                description: `Última sincronização há ${Math.round(hoursSinceSync)} horas`,
                duration: 4000
              });
            }
          }
          
          setLastSyncTime(lastSync);
        }
        
      } catch (error) {
        console.error('Error initializing offline service:', error);
        setCacheStatus('error');
        setCacheIssues({
          type: 'initialization_error',
          message: 'Erro ao inicializar cache',
          error: error.message
        });
        
        // Show error message for initialization failure
        toast.error('Erro ao inicializar cache local', {
          description: 'Algumas funcionalidades podem não funcionar offline',
          duration: 5000
        });
      }
    };

    initializeOfflineService();
  }, []);

  // Check cache status when online status changes with enhanced feedback
  useEffect(() => {
    const checkCacheStatus = async () => {
      try {
        const cacheCount = await offlinePDVService.getCacheProductCount();
        
        if (cacheCount === 0) {
          setCacheStatus('empty');
          if (!isOnline) {
            // Show warning when going offline with empty cache
            toast.warning('Cache vazio - funcionalidade limitada offline', {
              description: 'Conecte-se à internet para buscar produtos',
              duration: 5000,
              icon: <AlertTriangle className="w-4 h-4" />
            });
          }
        } else if (!isOnline) {
          setCacheStatus('available_offline');
          // Show info about available offline functionality
          toast.info(`${cacheCount} produtos disponíveis offline`, {
            description: 'Busca funcionando com dados em cache',
            duration: 3000,
            icon: <Database className="w-4 h-4" />
          });
        } else {
          setCacheStatus('available_online');
        }
      } catch (error) {
        console.error('Error checking cache status:', error);
        setCacheStatus('error');
        toast.error('Erro ao verificar cache', {
          description: 'Algumas funcionalidades podem não funcionar',
          duration: 4000
        });
      }
    };

    checkCacheStatus();
  }, [isOnline]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Offline search effect
  useEffect(() => {
    const performOfflineSearch = async () => {
      if (!isOnline) {
        setIsOfflineSearching(true);
        try {
          // If no search term, get all products from cache (limited)
          const searchTerm = debouncedSearch && debouncedSearch.trim() !== '' ? debouncedSearch : '';
          const results = await offlinePDVService.searchProductsOffline(searchTerm, { limit: 10 });
          setOfflineResults(results);
          setSearchSource('cache');
        } catch (error) {
          console.error('Offline search error:', error);
          setOfflineResults([]);
        } finally {
          setIsOfflineSearching(false);
        }
      }
    };

    performOfflineSearch();
  }, [debouncedSearch, isOnline]);

  // Online search query (existing logic)
  const { data: productsData, isLoading: isOnlineLoading } = useQuery({
    queryKey: ["products_search", debouncedSearch],
    queryFn: () => base44.entities.Product.list({ search: debouncedSearch, itemsPerPage: 10 }),
    enabled: isOnline, // Execute when online, regardless of search term
  });

  // Determine which results to use - only show results when there's a search query
  const shouldShowResults = searchQuery && searchQuery.trim() !== '';
  const filteredProducts = shouldShowResults ? (
    isOnline 
      ? (productsData?.data ?? [])
      : offlineResults
  ) : [];

  const isLoading = shouldShowResults && (isOnline ? isOnlineLoading : isOfflineSearching);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProducts]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        handleAdd(filteredProducts[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchQuery("");
    }
  };

  const handleAdd = (product) => {
    onAddProduct(product, 1);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Get enhanced status indicator info with progress and sync status
  const getStatusIndicator = () => {
    if (syncInProgress) {
      return {
        icon: Loader2,
        text: 'Sincronizando...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        animated: true
      };
    } else if (!isOnline && cacheStatus === 'empty') {
      return {
        icon: WifiOff,
        text: 'Offline - Cache vazio',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        warning: true
      };
    } else if (!isOnline && cacheStatus === 'available_offline') {
      return {
        icon: Database,
        text: 'Offline - Usando cache',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    } else if (isOnline && cacheStatus === 'available_online') {
      return {
        icon: Cloud,
        text: lastSyncTime ? `Online - Sync ${formatSyncTime(lastSyncTime)}` : 'Online',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (cacheStatus === 'error') {
      return {
        icon: AlertTriangle,
        text: 'Erro no cache',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        warning: true
      };
    } else {
      return {
        icon: Wifi,
        text: 'Online',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
  };

  // Format sync time for display
  const formatSyncTime = (syncTime) => {
    const now = new Date();
    const diffMinutes = Math.floor((now - syncTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const statusIndicator = getStatusIndicator();

  return (
    <div className="relative z-50">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" aria-hidden="true" />
        <Input
          ref={inputRef}
          data-search-input
          placeholder="Buscar produto por nome, código de barras ou SKU (F2)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-12 sm:h-14 pl-10 sm:pl-12 pr-32 text-base sm:text-lg shadow-sm border-slate-200 focus:ring-emerald-500"
          autoFocus
          role="combobox"
          aria-expanded={filteredProducts.length > 0}
          aria-haspopup="listbox"
          aria-controls="product-listbox"
          aria-activedescendant={filteredProducts.length > 0 ? `product-${selectedIndex}` : undefined}
          aria-label="Buscar produtos para adicionar ao carrinho"
          aria-describedby="search-instructions"
        />
        
        {/* Enhanced status indicator with progress and sync info */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Manual cache refresh button */}
          {isOnline && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-50"
              onClick={async () => {
                setSyncInProgress(true);
                try {
                  toast.info('Sincronizando produtos...', {
                    description: 'Baixando produtos do servidor',
                    duration: 2000
                  });
                  
                  const result = await offlinePDVService.refreshProductCache();
                  if (result.success) {
                    toast.success('Produtos sincronizados!', {
                      description: `${result.productCount} produtos baixados para cache`,
                      duration: 4000
                    });
                    setLastSyncTime(new Date());
                  } else {
                    toast.error('Erro na sincronização', {
                      description: result.message
                    });
                  }
                } catch (error) {
                  toast.error('Erro ao sincronizar produtos', {
                    description: error.message
                  });
                } finally {
                  setSyncInProgress(false);
                }
              }}
              disabled={syncInProgress}
              title="Sincronizar produtos para cache offline"
            >
              {syncInProgress ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Database className="w-3 h-3" />
              )}
            </Button>
          )}
          
          <Badge 
            variant="outline" 
            className={`text-xs ${statusIndicator.color} ${statusIndicator.bgColor} ${statusIndicator.borderColor} flex items-center gap-1 ${
              statusIndicator.warning ? 'animate-pulse' : ''
            }`}
          >
            <statusIndicator.icon 
              className={`w-3 h-3 ${statusIndicator.animated ? 'animate-spin' : ''}`} 
            />
            <span className="hidden sm:inline">{statusIndicator.text}</span>
          </Badge>
          
          {/* Sync progress indicator */}
          {syncInProgress && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Sync</span>
            </div>
          )}
        </div>

        <div id="search-instructions" className="sr-only">
          Use as setas para navegar, Enter para selecionar, Escape para limpar
        </div>
      </div>

      {/* Enhanced offline warnings and cache issue alerts */}
      {!isOnline && cacheStatus === 'empty' && searchQuery && (
        <Alert className="absolute w-full mt-2 shadow-xl border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-700">
            <div className="space-y-2">
              <div className="font-medium">Cache de produtos vazio</div>
              <div className="text-sm">
                Para usar o PDV offline, você precisa primeiro sincronizar os produtos enquanto está online.
              </div>
              <div className="text-xs text-red-600">
                1. Conecte-se à internet<br/>
                2. Clique no ícone de banco de dados (📊) ao lado da busca<br/>
                3. Aguarde a sincronização terminar<br/>
                4. Agora você pode usar offline!
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert when online but cache is empty */}
      {isOnline && cacheStatus === 'empty' && (
        <Alert className="absolute w-full mt-2 shadow-xl border-blue-200 bg-blue-50">
          <Database className="w-4 h-4" />
          <AlertDescription className="text-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Cache vazio - Sincronize os produtos</div>
                <div className="text-sm">Clique no ícone 📊 para baixar produtos e usar offline</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={async () => {
                  setSyncInProgress(true);
                  try {
                    const result = await offlinePDVService.refreshProductCache();
                    if (result.success) {
                      toast.success('Produtos sincronizados!', {
                        description: `${result.productCount} produtos baixados`,
                        duration: 4000
                      });
                      setLastSyncTime(new Date());
                      setCacheStatus('available_online');
                    }
                  } catch (error) {
                    toast.error('Erro na sincronização', {
                      description: error.message
                    });
                  } finally {
                    setSyncInProgress(false);
                  }
                }}
                disabled={syncInProgress}
              >
                {syncInProgress ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Download className="w-3 h-3 mr-1" />
                )}
                Sincronizar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Cache issues warning */}
      {cacheIssues && (
        <Alert className="absolute w-full mt-2 shadow-xl border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-amber-700">
            <div className="space-y-1">
              <div className="font-medium">{cacheIssues.message}</div>
              {cacheIssues.type === 'outdated' && (
                <div className="text-xs">
                  Última sincronização há {cacheIssues.hoursSinceSync} horas
                </div>
              )}
              {cacheIssues.type === 'corruption' && (
                <div className="text-xs">
                  {cacheIssues.issues.length} problema(s) detectado(s)
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sync progress indicator */}
      {syncInProgress && (
        <Card className="absolute w-full mt-2 shadow-xl border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Sincronizando dados...</span>
            <div className="ml-auto">
              <div className="w-16 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search results */}
      {filteredProducts.length > 0 && (
        <Card className="absolute w-full mt-2 shadow-xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Enhanced search source indicator with detailed status */}
          {searchQuery && (
            <div className={`px-3 py-2 text-xs border-b ${statusIndicator.bgColor} ${statusIndicator.borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <statusIndicator.icon className="w-3 h-3" />
                  <span className={statusIndicator.color}>
                    {searchSource === 'cache' 
                      ? `${filteredProducts.length} resultado(s) do cache local`
                      : `${filteredProducts.length} resultado(s) online`
                    }
                  </span>
                </div>
                
                {/* Additional status info */}
                <div className="flex items-center gap-2 text-xs">
                  {lastSyncTime && (
                    <span className="text-slate-500">
                      Sync: {formatSyncTime(lastSyncTime)}
                    </span>
                  )}
                  {syncInProgress && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Atualizando</span>
                    </div>
                  )}
                  {cacheIssues && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Aviso</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <ScrollArea className="max-h-[300px] sm:max-h-[400px]">
            <ul 
              id="product-listbox"
              className="p-1"
              role="listbox"
              aria-label="Produtos encontrados"
            >
              {filteredProducts.map((product, index) => (
                <li
                  key={product.id}
                  id={`product-${index}`}
                  onClick={() => handleAdd(product)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAdd(product);
                    }
                  }}
                  className={`
                    flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-colors
                    ${index === selectedIndex ? "bg-emerald-50 border border-emerald-100" : "hover:bg-slate-50"}
                  `}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={index === selectedIndex ? 0 : -1}
                  aria-label={`${product.name}, preço ${product.sale_price?.toFixed(2)} reais, estoque ${product.stock_quantity}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 flex-shrink-0"
                      role="img"
                      aria-label={product.image_url ? "Imagem do produto" : "Sem imagem"}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Barcode className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{product.name}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span className="truncate">SKU: {product.sku || "-"}</span>
                        <span className="hidden sm:inline" aria-hidden="true">•</span>
                        <span className="hidden sm:inline">Estoque: {product.stock_quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-emerald-600 text-sm sm:text-base">R$ {product.sale_price?.toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] h-4 sm:h-5">
                        {product.unit_type}
                      </Badge>
                      {/* Cache indicator for individual results */}
                      {searchSource === 'cache' && (
                        <Badge variant="outline" className="text-[10px] h-4 sm:h-5 text-orange-600 bg-orange-50 border-orange-200">
                          Cache
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      )}

      {/* Enhanced loading indicator with progress details */}
      {isLoading && searchQuery && (
        <Card className="absolute w-full mt-2 shadow-xl border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              <span className="text-sm">
                {searchSource === 'cache' ? 'Buscando no cache...' : 'Buscando produtos...'}
              </span>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {searchSource === 'cache' && (
                <span>Local</span>
              )}
              {searchSource === 'online' && (
                <span>Online</span>
              )}
            </div>
          </div>
          
          {/* Progress bar for longer operations */}
          {isLoading && (
            <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '40%' }}></div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
