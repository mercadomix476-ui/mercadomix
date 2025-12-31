import React from 'react';
import { Wifi, WifiOff, Loader2, Cloud, CloudOff } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineIndicator() {
  const { 
    isOnline, 
    pendingOperations, 
    syncInProgress, 
    syncPendingOperations 
  } = useOfflineSync();

  const handleSyncClick = () => {
    if (isOnline && !syncInProgress) {
      syncPendingOperations();
    }
  };

  if (isOnline && pendingOperations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Wifi className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">Online</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-orange-600">
        <WifiOff className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">Offline</span>
        {pendingOperations.length > 0 && (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
            {pendingOperations.length}
          </Badge>
        )}
      </div>
    );
  }

  if (isOnline && pendingOperations.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSyncClick}
          disabled={syncInProgress}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 h-auto"
        >
          {syncInProgress ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
          <span className="text-xs font-medium hidden sm:inline">
            {syncInProgress ? 'Sincronizando...' : 'Sincronizar'}
          </span>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {pendingOperations.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return null;
}

export default OfflineIndicator;