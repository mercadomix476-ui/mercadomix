import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Hook para gerenciar atalhos de teclado globais do aplicativo
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Definição dos atalhos de teclado
  const shortcuts = {
    // Navegação principal
    'Alt+1': { action: () => navigate('/'), description: 'Ir para Dashboard' },
    'Alt+2': { action: () => navigate('/pdv'), description: 'Abrir PDV' },
    'Alt+3': { action: () => navigate('/products'), description: 'Ir para Produtos' },
    'Alt+4': { action: () => navigate('/sales'), description: 'Ir para Vendas' },
    'Alt+5': { action: () => navigate('/stock'), description: 'Ir para Estoque' },
    'Alt+6': { action: () => navigate('/reports'), description: 'Ir para Relatórios' },
    'Alt+7': { action: () => navigate('/settings'), description: 'Ir para Configurações' },
    
    // Ações específicas do PDV
    'F1': { action: () => handlePDVAction('help'), description: 'Ajuda (PDV)' },
    'F2': { action: () => handlePDVAction('search'), description: 'Buscar Produto (PDV)' },
    'F3': { action: () => handlePDVAction('payment'), description: 'Finalizar Venda (PDV)' },
    'F4': { action: () => handlePDVAction('cancel'), description: 'Cancelar Venda (PDV)' },
    // 'F5': { action: () => handlePDVAction('refresh'), description: 'Atualizar (PDV)' }, // Desabilitado temporariamente
    'F9': { action: () => handlePDVAction('discount'), description: 'Aplicar Desconto (PDV)' },
    // 'F12': { action: () => handlePDVAction('drawer'), description: 'Abrir Gaveta (PDV)' }, // Desabilitado temporariamente
    
    // Ações gerais
    'Ctrl+N': { action: () => handleGeneralAction('new'), description: 'Novo Item' },
    'Ctrl+S': { action: () => handleGeneralAction('save'), description: 'Salvar' },
    'Ctrl+F': { action: () => handleGeneralAction('search'), description: 'Buscar' },
    'Ctrl+P': { action: () => handleGeneralAction('print'), description: 'Imprimir' },
    'Escape': { action: () => handleGeneralAction('escape'), description: 'Cancelar/Fechar' },
    
    // Atalhos de ajuda
    'Ctrl+?': { action: () => showShortcutsHelp(), description: 'Mostrar Atalhos' },
    'F1+Ctrl': { action: () => showShortcutsHelp(), description: 'Mostrar Atalhos' }
  };

  // Função para lidar com ações específicas do PDV
  const handlePDVAction = useCallback((action) => {
    if (location.pathname !== '/pdv') {
      toast.info('Este atalho funciona apenas no PDV');
      return;
    }

    // Disparar eventos customizados para o componente PDV escutar
    const event = new CustomEvent('pdv-shortcut', { 
      detail: { action } 
    });
    window.dispatchEvent(event);
  }, [location.pathname]);

  // Função para lidar com ações gerais
  const handleGeneralAction = useCallback((action) => {
    const event = new CustomEvent('app-shortcut', { 
      detail: { action, currentPath: location.pathname } 
    });
    window.dispatchEvent(event);
  }, [location.pathname]);

  // Função para mostrar ajuda dos atalhos
  const showShortcutsHelp = useCallback(() => {
    toast.info('Atalhos de Teclado Disponíveis', {
      description: `Navegação:
Alt+1: Dashboard
Alt+2: PDV  
Alt+3: Produtos
Alt+4: Vendas
Alt+5: Estoque
Alt+6: Relatórios
Alt+7: Configurações

PDV:
F2: Buscar Produto
F3: Finalizar Venda
F4: Cancelar Venda
F9: Aplicar Desconto
F12: Abrir Gaveta

Geral:
Ctrl+N: Novo Item
Ctrl+S: Salvar
Ctrl+F: Buscar
Escape: Cancelar/Fechar`,
      duration: 10000
    });
  }, []);

  // Função para verificar se uma combinação de teclas foi pressionada
  const isKeyCombo = useCallback((event, combo) => {
    const keys = combo.split('+');
    const keyChecks = {
      'Ctrl': event.ctrlKey,
      'Alt': event.altKey,
      'Shift': event.shiftKey,
      'Meta': event.metaKey
    };

    // Verificar modificadores
    for (const key of keys) {
      if (keyChecks[key] !== undefined) {
        if (!keyChecks[key]) return false;
      } else {
        // Verificar tecla principal
        const keyCode = key.length === 1 ? key.toUpperCase() : key;
        if (event.key !== keyCode && event.code !== keyCode) {
          return false;
        }
      }
    }

    return true;
  }, []);

  // Handler principal para eventos de teclado
  const handleKeyDown = useCallback((event) => {
    // Ignorar se estiver digitando em um input/textarea
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return;
    }

    // Verificar cada atalho
    for (const [combo, { action }] of Object.entries(shortcuts)) {
      if (isKeyCombo(event, combo)) {
        event.preventDefault();
        event.stopPropagation();
        action();
        return;
      }
    }
  }, [shortcuts, isKeyCombo]);

  // Configurar listeners de eventos
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Retornar funções úteis para outros componentes
  return {
    shortcuts,
    showShortcutsHelp,
    handlePDVAction,
    handleGeneralAction
  };
};

export default useKeyboardShortcuts;