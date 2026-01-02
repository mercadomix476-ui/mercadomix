import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Boxes, 
  BarChart3, 
  Settings, 
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api as base44 } from "@/api/supabaseService";
import { SimpleUserMenu } from "@/components/auth/SimpleUserMenu";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";
import { StoreLogo } from "@/components/ui/LogoDisplay";

const menuItems = [
  { 
    icon: Home, 
    label: "Início", 
    path: "/", 
    description: "Ir para página inicial",
    public: true // Sempre visível para usuários autenticados
  },
  { 
    icon: ShoppingCart, 
    label: "PDV", 
    path: "/pdv", 
    description: "Abrir ponto de venda",
    requiredPermission: PERMISSIONS.PDV_ACCESS
  },
  { 
    icon: Package, 
    label: "Produtos", 
    path: "/products", 
    description: "Gerenciar produtos",
    requiredPermission: PERMISSIONS.PRODUCTS_VIEW
  },
  { 
    icon: Boxes, 
    label: "Estoque", 
    path: "/stock", 
    description: "Controlar estoque",
    requiredPermission: PERMISSIONS.STOCK_VIEW
  },
  { 
    icon: BarChart3, 
    label: "Vendas", 
    path: "/sales", 
    description: "Visualizar vendas",
    requiredPermission: PERMISSIONS.SALES_VIEW
  },
  { 
    icon: BarChart3, 
    label: "Relatórios", 
    path: "/reports", 
    description: "Ver relatórios",
    requiredPermission: PERMISSIONS.REPORTS_VIEW
  },
  { 
    icon: Settings, 
    label: "Configurações", 
    path: "/settings", 
    description: "Configurar sistema",
    requiredPermission: PERMISSIONS.SETTINGS_VIEW
  },
];

export function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const { filterMenuItems } = usePermissions();
  
  // Buscar configurações da loja para obter nome da loja
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const list = await base44.entities.StoreSettings.list();
      return list[0] || {};
    },
  });

  // LÓGICA SIMPLES: Sempre usa a logo do cliente no sistema interno
  const logoUrl = "/branding/mercadinho-mix-logo.jpg";
  const storeNameToUse = settings?.store_name || "Mercadinho Mix";

  // Filtrar itens do menu baseado nas permissões do usuário
  const visibleMenuItems = filterMenuItems(menuItems);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1B4332] text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1B4332]"
        aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        aria-expanded={isOpen}
        aria-controls="sidebar-navigation"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside 
        id="sidebar-navigation"
        className={cn(
          "h-screen w-64 bg-[#1B4332] text-white flex flex-col shadow-xl fixed left-0 top-0 z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Menu principal de navegação"
      >
        {/* Logo Area */}
        <div className="p-4 sm:p-6 border-b border-[#2D6A4F]/30 flex items-center gap-3">
          <StoreLogo
            logoUrl={logoUrl}
            storeName={storeNameToUse}
            size="large"
            showBorder={true}
            borderColor="border-emerald-600"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base sm:text-lg leading-tight truncate">{storeNameToUse}</h1>
            <p className="text-xs text-white/60 truncate">Sistema Multi-Empresas</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-3 sm:p-4 border-b border-[#2D6A4F]/30">
          <SimpleUserMenu />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto" role="list">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onToggle(false)} // Close sidebar on mobile when item is clicked
                className={cn(
                  "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1B4332]",
                  isActive 
                    ? "bg-white text-[#1B4332] shadow-md font-medium" 
                    : "text-white/80 hover:bg-[#2D6A4F]/50 hover:text-white"
                )}
                role="listitem"
                aria-label={item.description}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon 
                  className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-[#1B4332]" : "text-white/80 group-hover:text-white")} 
                  aria-hidden="true"
                />
                <span className="text-sm sm:text-base truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile and Logout */}
        <div className="p-3 sm:p-4 border-t border-[#2D6A4F]/30 space-y-3">
          <SimpleUserMenu />
          
          {/* Keyboard Shortcuts Help */}
          <KeyboardShortcutsHelp 
            trigger={
              <button className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-white/80 hover:bg-[#2D6A4F]/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1B4332]">
                <span className="text-sm sm:text-base">⌨️ Atalhos</span>
              </button>
            }
          />
          
          {/* Logout Button */}
          <LogoutButton 
            variant="ghost"
            className="w-full justify-start text-white hover:text-white hover:bg-[#2D6A4F]/50 border-0 bg-transparent"
            style={{
              color: 'white',
              backgroundColor: 'transparent'
            }}
            showText={true}
          />
        </div>
      </aside>
    </>
  );
}
