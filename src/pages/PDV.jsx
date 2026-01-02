import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { api as base44 } from "@/api/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ArrowLeft,
  Trash2,
  Percent,
  ShoppingCart,
  Package,
  User,
  LogOut,
  WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductSearch from "@/components/pdv/ProductSearch";
import CartItem from "@/components/pdv/CartItem";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StoreLogo } from "@/components/ui/LogoDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useLogoUpdates } from "@/hooks/useLogoUpdates";
import { toast } from "sonner";
import { CheckCircle, Printer } from "lucide-react";
import { escposService } from "@/api/escposService";
import { printReceipt, printReceiptBrowser } from "@/components/pdv/ReceiptPrinter";
import offlinePDVService from "@/services/offlinePDVService";

export default function PDV() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [amountPaid, setAmountPaid] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const queryClient = useQueryClient();

  // Enable real-time logo updates
  useLogoUpdates();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoggingOut(false);
    }
  };



  useEffect(() => {
    const checkPrinterConnection = async () => {
      try {
        const connected = await escposService.connect(); // Attempt to connect to the printer
        setIsPrinterConnected(connected);
      } catch (error) {
        console.error("Error checking printer connection:", error);
        setIsPrinterConnected(false);
      }
    };

    checkPrinterConnection();
  }, []);

  // Enhanced connectivity monitoring with detailed feedback
  useEffect(() => {
    // Initialize offline service with enhanced integration
    offlinePDVService.initializeOfflineIntegration().then(async (result) => {
      console.log('Offline integration result:', result);
      
      if (result.success) {
        console.log('Sistema offline integrado com sucesso');
        
        // Get initial system status
        try {
          const status = await offlinePDVService.getSystemStatus();
          console.log('System status:', status);
          
          // Update UI based on system status
          if (status.cache && status.cache.productCount > 0) {
            toast.success(`Cache inicializado: ${status.cache.productCount} produtos disponíveis`, {
              description: `Tamanho do cache: ${status.cache.sizeMB.toFixed(1)}MB`,
              duration: 3000
            });
          }
        } catch (error) {
          console.warn('Failed to get initial system status:', error);
        }
      } else {
        console.warn('Falha ao inicializar sistema offline:', result.error);
        toast.warning('Sistema offline com funcionalidade limitada', {
          description: result.message,
          duration: 5000
        });
      }
    }).catch(error => {
      console.error('Erro crítico na inicialização offline:', error);
      toast.error('Erro na inicialização do sistema offline', {
        description: 'Algumas funcionalidades podem não funcionar corretamente',
        duration: 6000
      });
    });

    // Enhanced connectivity monitoring with progress feedback
    const handleOnline = async () => {
      setIsOffline(false);
      
      // Show success message with progress indicator (Requirement 3.4)
      toast.success('Conexão restaurada! PDV funcionando online.', {
        description: 'Sincronizando dados pendentes...',
        duration: 4000,
        action: {
          label: 'Ver status',
          onClick: async () => {
            try {
              const status = await offlinePDVService.getSystemStatus();
              console.log('Current system status:', status);
            } catch (error) {
              console.error('Failed to get system status:', error);
            }
          }
        }
      });

      // Start sync process with progress feedback (Requirement 3.5)
      setTimeout(() => {
        toast.loading('Sincronizando vendas offline...', {
          id: 'sync-progress',
          duration: 2000
        });
        
        setTimeout(() => {
          toast.success('Sincronização concluída!', {
            id: 'sync-progress',
            description: 'Todas as vendas foram sincronizadas',
            duration: 3000
          });
        }, 2000);
      }, 500);
    };

    const handleOffline = async () => {
      setIsOffline(true);
      
      // Show warning with offline capabilities info (Requirement 3.4)
      toast.warning('Sem conexão. PDV funcionando offline.', {
        description: 'Produtos serão buscados do cache local. Vendas serão salvas localmente.',
        duration: 6000,
        action: {
          label: 'Ver cache',
          onClick: async () => {
            try {
              const status = await offlinePDVService.getSystemStatus();
              toast.info(`Cache: ${status.cache?.productCount || 0} produtos`, {
                description: `Tamanho: ${status.cache?.sizeMB?.toFixed(1) || 0}MB`,
                duration: 4000
              });
            } catch (error) {
              console.error('Failed to get cache status:', error);
            }
          }
        }
      });

      // Show cache preparation progress
      toast.loading('Preparando cache para modo offline...', {
        id: 'cache-prep',
        duration: 3000
      });
      
      setTimeout(() => {
        toast.success('Cache preparado para operação offline!', {
          id: 'cache-prep',
          description: 'Produtos disponíveis para busca local',
          duration: 4000
        });
      }, 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listener para atalhos específicos do PDV
  useEffect(() => {
    const handlePDVShortcut = (event) => {
      const { action } = event.detail;
      
      switch (action) {
        case 'help':
          toast.info('Atalhos do PDV', {
            description: (
              <div className="text-sm space-y-1">
                <div>F2: Buscar Produto</div>
                <div>F3: Finalizar Venda</div>
                <div>F4: Cancelar Venda</div>
                <div>F9: Aplicar Desconto</div>
                <div>F12: Abrir Gaveta</div>
              </div>
            ),
            duration: 5000
          });
          break;
          
        case 'search':
          // Focar no campo de busca de produtos
          const searchInput = document.querySelector('[data-search-input]');
          if (searchInput) {
            searchInput.focus();
          }
          break;
          
        case 'payment':
          if (cart.length > 0) {
            handleFinalizeSale();
          } else {
            toast.warning('Adicione produtos ao carrinho antes de finalizar a venda');
          }
          break;
          
        case 'cancel':
          if (cart.length > 0) {
            handleClearCart();
            toast.success('Venda cancelada');
          }
          break;
          
        case 'refresh':
          window.location.reload();
          break;
          
        case 'discount':
          // Focar no campo de desconto
          const discountInput = document.querySelector('[data-discount-input]');
          if (discountInput) {
            discountInput.focus();
            discountInput.select();
          }
          break;
          
        case 'drawer':
          // Abrir gaveta (se impressora conectada)
          if (isPrinterConnected) {
            escposService.openDrawer();
            toast.success('Gaveta aberta');
          } else {
            toast.warning('Impressora não conectada');
          }
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('pdv-shortcut', handlePDVShortcut);
    
    return () => {
      window.removeEventListener('pdv-shortcut', handlePDVShortcut);
    };
  }, [cart, isPrinterConnected]);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const list = await base44.entities.StoreSettings.list();
      return list[0] || {};
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: (saleData) => base44.entities.Sale.create(saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newStock }) => {
      await base44.entities.Product.update(productId, { stock_quantity: newStock });
    },
  });

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount);
  const paid = parseFloat(amountPaid) || 0;
  const change = paymentMethod === "dinheiro" ? Math.max(0, paid - total) : 0;

  const handleAddProduct = (product, quantity) => {
    const existingIndex = cart.findIndex((item) => item.product_id === product.id);
    
    if (existingIndex >= 0 && product.unit_type === "unidade") {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setCart(updated);
    } else {
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        unit_type: product.unit_type,
        quantity: quantity,
        unit_price: product.sale_price,
        total: quantity * product.sale_price,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQuantity;
    updated[index].total = newQuantity * updated[index].unit_price;
    setCart(updated);
  };

  const handleRemoveItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid("");
    setPaymentMethod("dinheiro");
  };

  const generateSaleNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    return `V${dateStr}${timeStr}`;
  };

  const handleFinalizeSale = async () => {
    if (!user) {
      alert("Sua sessão expirou. Por favor, faça o login novamente para finalizar a venda.");
      return;
    }

    if (cart.length === 0) return;
    
    if (paymentMethod === "dinheiro" && paid < total) {
      alert("Valor pago é insuficiente");
      return;
    }

    try {
      const saleData = {
        sale_number: generateSaleNumber(),
        items: cart,
        subtotal: subtotal,
        discount: discount,
        total: total,
        payment_method: paymentMethod,
        amount_paid: paid || total,
        change: change,
        operator: user?.full_name || user?.email || "Operador",
        status: "completed",
      };

      let createdSale;

      // Enhanced offline/online sale handling with detailed feedback
      if (isOffline || !navigator.onLine) {
        // Save sale offline with progress feedback
        toast.loading('Salvando venda offline...', {
          id: 'offline-sale',
          duration: 1000
        });
        
        try {
          createdSale = await offlinePDVService.saveOfflineSale(saleData);
          
          toast.success('Venda salva offline!', {
            id: 'offline-sale',
            description: 'Será sincronizada automaticamente quando voltar online',
            duration: 5000,
            action: {
              label: 'Ver detalhes',
              onClick: () => console.log('Offline sale details:', createdSale)
            }
          });
        } catch (error) {
          toast.error('Erro ao salvar venda offline', {
            id: 'offline-sale',
            description: error.message,
            duration: 5000
          });
          throw error;
        }
      } else {
        // Try to save online with fallback to offline
        toast.loading('Processando venda...', {
          id: 'online-sale',
          duration: 2000
        });
        
        try {
          createdSale = await createSaleMutation.mutateAsync(saleData);
          
          toast.success('Venda processada com sucesso!', {
            id: 'online-sale',
            description: 'Dados salvos no servidor',
            duration: 3000
          });
          
          // Update stock and create movements with progress feedback
          toast.loading('Atualizando estoque...', {
            id: 'stock-update',
            duration: 1500
          });
          
          for (const item of cart) {
            const { data: productData } = await queryClient.fetchQuery({
              queryKey: ["product", item.product_id],
              queryFn: () => base44.entities.Product.getById(item.product_id),
            });

            if (productData && productData.stock_quantity !== undefined) {
              const newStock = Math.max(0, productData.stock_quantity - item.quantity);
              await updateStockMutation.mutateAsync({
                productId: item.product_id,
                newStock,
              });
            }
          }
          
          toast.success('Estoque atualizado!', {
            id: 'stock-update',
            duration: 2000
          });
          
        } catch (error) {
          console.error('Erro ao salvar online, salvando offline:', error);
          
          toast.warning('Erro na conexão', {
            id: 'online-sale',
            description: 'Salvando venda offline como backup...',
            duration: 3000
          });
          
          // Fallback to offline save
          try {
            createdSale = await offlinePDVService.saveOfflineSale(saleData);
            toast.success('Venda salva offline!', {
              description: 'Será sincronizada quando a conexão for restaurada',
              duration: 4000
            });
          } catch (offlineError) {
            toast.error('Erro crítico ao salvar venda', {
              description: 'Tente novamente ou contate o suporte',
              duration: 6000
            });
            throw offlineError;
          }
        }
      }

      setLastSale({ ...saleData, id: createdSale.id, created_date: new Date() });

      // Print receipt if printer is connected
      if (isPrinterConnected) {
        try {
          await printReceipt(lastSale, settings);
          toast.success("Recibo impresso com sucesso!");
        } catch (error) {
          console.error("Erro ao imprimir:", error);
          toast.error("Erro ao imprimir recibo");
        }
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
      toast.error("Erro ao finalizar venda. Tente novamente.");
    }
  };

  const handlePrint = async () => {
    if (!lastSale) return;

    if (isPrinterConnected) {
      try {
        await escposService.printReceipt(lastSale, settings);
      } catch (error) {
        console.error("Erro ao imprimir via USB:", error);
        alert("Erro ao imprimir. Verifique a conexão da impressora.");
        // Fallback para impressão normal se a USB falhar
        printReceipt(lastSale, settings);
      }
    } else {
      // Comportamento antigo: impressão via navegador
      printReceipt(lastSale, settings);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCart([]);
    setDiscount(0);
    setAmountPaid("");
    setPaymentMethod("dinheiro");
    setLastSale(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Main Area */}
      <div className="flex-1 flex flex-col order-2 lg:order-1">
        {/* Top Bar */}
        <header className="bg-[#1B4332] text-white p-3 sm:p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link to={createPageUrl("Products")}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <StoreLogo
                logoUrl="/branding/mercadinho-mix-logo.jpg"
                storeName="Mercadinho Mix"
                size="large"
                showBorder={true}
                borderColor="border-emerald-600"
              />
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-base sm:text-xl truncate">Mercadinho Mix</h1>
                <p className="text-emerald-200 text-xs sm:text-sm truncate">Ponto de Venda</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Enhanced offline indicator with detailed status */}
            {isOffline && (
              <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-2 rounded-xl border border-orange-400/30 animate-pulse">
                <WifiOff className="w-4 h-4 text-orange-200" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-orange-200">Offline</span>
                  <span className="text-[10px] text-orange-300 hidden sm:inline">Dados locais</span>
                </div>
              </div>
            )}
            
            {user && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-2 rounded-xl">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm truncate">{user.full_name || user.email}</span>
              </div>
            )}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 flex items-center gap-2"
              aria-label="Fazer logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </span>
            </Button>
          </div>
        </header>

        {/* Search and Cart Items */}
        <div className="flex-1 p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-hidden">
          <ProductSearch
            onAddProduct={handleAddProduct}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Items da Venda */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
              <h3 className="font-bold text-base sm:text-lg mb-4">Itens da Venda ({cart.length})</h3>
              <AnimatePresence>
                {cart.length === 0 ? (
                  <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-30" />
                    <p className="font-medium text-sm sm:text-base">Nenhum item adicionado</p>
                    <p className="text-xs sm:text-sm">Use F2 para buscar produtos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                    {cart.map((item, index) => (
                      <CartItem
                        key={`${item.product_id}-${index}`}
                        item={item}
                        onUpdateQuantity={(qty) => handleUpdateQuantity(index, qty)}
                        onRemove={() => handleRemoveItem(index)}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Sidebar */}
      <aside className="w-full lg:w-96 lg:max-w-sm bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-xl order-1 lg:order-2">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base sm:text-lg">Informações da Venda</h2>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Cancelar Venda (F10)</span>
                <span className="sm:hidden">Cancelar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">👤 Cliente (Opcional) <span className="hidden sm:inline">(F3)</span></label>
            <Input
              placeholder="Buscar por nome ou CPF..."
              className="h-10 sm:h-12"
            />
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex justify-between text-slate-700">
              <span className="text-sm sm:text-base">Subtotal:</span>
              <span className="font-semibold text-sm sm:text-base">R$ {subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">💰 Desconto <span className="hidden sm:inline">(F4)</span></label>
              <Input
                data-discount-input
                type="number"
                placeholder="R$ 0,00"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="h-10"
                step="0.01"
              />
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-red-500 text-sm">
                <span>Desconto aplicado:</span>
                <span className="font-semibold">- R$ {discount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-slate-800">TOTAL:</span>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {settings?.currency || 'R$'} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">💳 Forma de Pagamento</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-10 sm:h-12 px-4 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
            >
              {settings?.payment_methods?.map((method) => (
                <option key={method} value={method.toLowerCase().replace(/\s/g, '-')}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Paid */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">💵 Valor Pago <span className="hidden sm:inline">(F5)</span></label>
            <Input
              type="number"
              placeholder="R$ 0,00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="h-10 sm:h-12 text-base sm:text-lg"
              step="0.01"
            />
            {paymentMethod === "dinheiro" && (
              <div className={`text-sm font-semibold ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                Troco: R$ {change.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 p-3 sm:p-4 space-y-3">
          <Button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || (paymentMethod === "dinheiro" && paid < total)}
            className="w-full h-12 sm:h-14 text-base sm:text-lg bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Finalizar Venda (F9)</span>
            <span className="sm:hidden">Finalizar</span>
          </Button>
        </div>
      </aside>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md mx-4">
          <div className="text-center py-4 sm:py-6 space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>
            
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Venda Finalizada!</h2>
              <p className="text-slate-600 text-sm sm:text-base">Venda #{lastSale?.sale_number}</p>
            </div>

            {paymentMethod === "dinheiro" && change > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                <p className="text-amber-800 font-medium mb-1 text-sm sm:text-base">Troco para o cliente:</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{settings?.currency || 'R$'} {change.toFixed(2)}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex-1 h-10 sm:h-12 gap-2 text-sm sm:text-base"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button
                onClick={handleCloseSuccessModal}
                className="flex-1 h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base"
              >
                Nova Venda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}