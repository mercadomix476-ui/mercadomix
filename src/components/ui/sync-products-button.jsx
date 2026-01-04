import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import offlinePDVService from '@/services/offlinePDVService';
import { toast } from 'sonner';

/**
 * Botão simples para sincronizar produtos do Supabase para o cache
 * Pode ser usado em qualquer lugar da aplicação
 */
export function SyncProductsButton({ 
  variant = "outline", 
  size = "default",
  showText = true,
  className = "",
  onSuccess,
  onError 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error('Sem conexão com a internet');
      return;
    }

    setIsLoading(true);

    try {
      toast.info('Sincronizando produtos...', {
        description: 'Buscando dados do servidor',
        duration: 2000
      });

      const result = await offlinePDVService.refreshProductCache();

      if (result.success) {
        setLastSync(new Date());
        toast.success('Produtos sincronizados!', {
          description: result.message,
          duration: 4000
        });
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização', {
        description: error.message,
        duration: 5000
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {showText && <span className="ml-2">Sincronizando...</span>}
        </>
      );
    }

    if (lastSync) {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          {showText && <span className="ml-2">Sincronizado</span>}
        </>
      );
    }

    return (
      <>
        <Download className="w-4 h-4" />
        {showText && <span className="ml-2">Sincronizar</span>}
      </>
    );
  };

  const getTooltipText = () => {
    if (isLoading) return 'Sincronizando produtos...';
    if (!navigator.onLine) return 'Sem conexão com a internet';
    if (lastSync) return `Última sincronização: ${lastSync.toLocaleTimeString()}`;
    return 'Sincronizar produtos do servidor para cache offline';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={isLoading || !navigator.onLine}
            className={className}
          >
            {getButtonContent()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Versão compacta do botão (apenas ícone)
 */
export function SyncProductsIconButton(props) {
  return (
    <SyncProductsButton 
      {...props}
      showText={false}
      size="sm"
      className="h-8 w-8 p-0"
    />
  );
}

export default SyncProductsButton;