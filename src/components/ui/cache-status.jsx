import React from 'react';
import { Database, Wifi, WifiOff, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOfflineProductCache } from '@/hooks/useOfflineProductCache';

/**
 * Componente para exibir o status do cache de produtos
 * Mostra informações sobre conectividade, cache e permite atualização manual
 */
export function CacheStatus({ compact = false, showRefreshButton = true }) {
  const { 
    cacheStats, 
    isLoading, 
    error, 
    refreshCache, 
    isOnline, 
    hasCache, 
    cacheAge 
  } = useOfflineProductCache();

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertTriangle,
        text: 'Erro no cache',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        variant: 'destructive'
      };
    }

    if (!isOnline && !hasCache) {
      return {
        icon: WifiOff,
        text: 'Offline - Sem cache',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        variant: 'destructive'
      };
    }

    if (!isOnline && hasCache) {
      return {
        icon: Database,
        text: `Offline - ${cacheStats.productCount} produtos`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        variant: 'secondary'
      };
    }

    if (isOnline && hasCache) {
      const ageText = cacheAge !== null ? 
        (cacheAge < 1 ? 'agora' : cacheAge < 24 ? `${cacheAge}h` : `${Math.floor(cacheAge/24)}d`) : 
        '';
      
      return {
        icon: CheckCircle,
        text: `Online - ${cacheStats.productCount} produtos${ageText ? ` (${ageText})` : ''}`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        variant: 'default'
      };
    }

    return {
      icon: Wifi,
      text: 'Online - Inicializando',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      variant: 'default'
    };
  };

  const statusInfo = getStatusInfo();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <statusInfo.icon className="w-3 h-3" />
          )}
          <span className="text-xs">{statusInfo.text}</span>
        </Badge>
        
        {showRefreshButton && isOnline && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={refreshCache}
            disabled={isLoading}
            title="Atualizar cache"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <statusInfo.icon className="w-4 h-4" />
          )}
          <span className={statusInfo.color}>Status do Cache</span>
          
          {showRefreshButton && isOnline && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={refreshCache}
              disabled={isLoading}
              title="Atualizar cache"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Status:</span>
            <span className={statusInfo.color}>{statusInfo.text}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-600">Produtos:</span>
            <span>{cacheStats.productCount.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-600">Tamanho:</span>
            <span>{cacheStats.cacheSizeMB.toFixed(1)} MB</span>
          </div>
          
          {cacheStats.lastFullSync && (
            <div className="flex justify-between">
              <span className="text-slate-600">Última sync:</span>
              <span className="text-xs">
                {new Date(cacheStats.lastFullSync).toLocaleString()}
              </span>
            </div>
          )}
          
          {error && (
            <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente simples para mostrar apenas o badge de status
 */
export function CacheStatusBadge() {
  return <CacheStatus compact={true} />;
}

export default CacheStatus;