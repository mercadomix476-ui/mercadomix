import React, { useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { Keyboard, Navigation, Zap, HelpCircle } from 'lucide-react';

export function KeyboardShortcutsHelp({ trigger }) {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    {
      category: 'Navegação',
      icon: <Navigation className="w-4 h-4" />,
      items: [
        { keys: ['Alt', '1'], description: 'Dashboard' },
        { keys: ['Alt', '2'], description: 'PDV' },
        { keys: ['Alt', '3'], description: 'Produtos' },
        { keys: ['Alt', '4'], description: 'Vendas' },
        { keys: ['Alt', '5'], description: 'Estoque' },
        { keys: ['Alt', '6'], description: 'Relatórios' },
        { keys: ['Alt', '7'], description: 'Configurações' },
      ]
    },
    {
      category: 'PDV',
      icon: <Zap className="w-4 h-4" />,
      items: [
        { keys: ['F2'], description: 'Buscar Produto' },
        { keys: ['F3'], description: 'Finalizar Venda' },
        { keys: ['F4'], description: 'Cancelar Venda' },
        { keys: ['F9'], description: 'Aplicar Desconto' },
        { keys: ['F12'], description: 'Abrir Gaveta' },
      ]
    },
    {
      category: 'Geral',
      icon: <Keyboard className="w-4 h-4" />,
      items: [
        { keys: ['Ctrl', 'N'], description: 'Novo Item' },
        { keys: ['Ctrl', 'S'], description: 'Salvar' },
        { keys: ['Ctrl', 'F'], description: 'Buscar' },
        { keys: ['Ctrl', 'P'], description: 'Imprimir' },
        { keys: ['Escape'], description: 'Cancelar/Fechar' },
        { keys: ['Ctrl', '?'], description: 'Mostrar Atalhos' },
      ]
    }
  ];

  const KeyBadge = ({ keys }) => (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="text-xs text-slate-400">+</span>}
          <Badge variant="outline" className="px-2 py-1 text-xs font-mono bg-white border-slate-300 text-slate-700">
            {key}
          </Badge>
        </React.Fragment>
      ))}
    </div>
  );

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
      <HelpCircle className="w-4 h-4" />
      Atalhos
    </Button>
  );

  const triggerElement = trigger ? (
    React.cloneElement(trigger, { onClick: () => setOpen(true) })
  ) : defaultTrigger;

  return (
    <>
      {triggerElement}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white text-slate-900 border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-xl font-bold">
              <Keyboard className="w-5 h-5 text-slate-700" />
              Atalhos de Teclado
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category} className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <span className="text-slate-600">{category.icon}</span>
                  {category.category}
                </h3>
                
                <div className="grid gap-2">
                  {category.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <span className="text-sm text-slate-700 font-medium">{item.description}</span>
                      <KeyBadge keys={item.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                💡 <strong className="text-slate-800">Dica:</strong> Os atalhos funcionam em qualquer lugar do aplicativo, 
                exceto quando você estiver digitando em campos de texto.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default KeyboardShortcutsHelp;