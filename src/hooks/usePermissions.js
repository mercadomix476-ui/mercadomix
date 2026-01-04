import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export function usePermissions() {
  const { user, hasPermission, hasRole, hasAnyRole, PERMISSIONS, USER_ROLES } = useAuth();

  // Memoizar permissões para evitar recálculos desnecessários
  const permissions = useMemo(() => {
    if (!user) return {};

    return {
      // Produtos
      canViewProducts: hasPermission(PERMISSIONS.PRODUCTS_VIEW),
      canCreateProducts: hasPermission(PERMISSIONS.PRODUCTS_CREATE),
      canEditProducts: hasPermission(PERMISSIONS.PRODUCTS_EDIT),
      canDeleteProducts: hasPermission(PERMISSIONS.PRODUCTS_DELETE),
      
      // Vendas
      canViewSales: hasPermission(PERMISSIONS.SALES_VIEW),
      canCreateSales: hasPermission(PERMISSIONS.SALES_CREATE),
      canCancelSales: hasPermission(PERMISSIONS.SALES_CANCEL),
      
      // Estoque
      canViewStock: hasPermission(PERMISSIONS.STOCK_VIEW),
      canEditStock: hasPermission(PERMISSIONS.STOCK_EDIT),
      canViewStockHistory: hasPermission(PERMISSIONS.STOCK_HISTORY),
      
      // Relatórios
      canViewReports: hasPermission(PERMISSIONS.REPORTS_VIEW),
      canExportReports: hasPermission(PERMISSIONS.REPORTS_EXPORT),
      
      // Configurações
      canViewSettings: hasPermission(PERMISSIONS.SETTINGS_VIEW),
      canEditSettings: hasPermission(PERMISSIONS.SETTINGS_EDIT),
      
      // PDV
      canAccessPDV: hasPermission(PERMISSIONS.PDV_ACCESS),
      canApplyDiscount: hasPermission(PERMISSIONS.PDV_DISCOUNT),
      canCancelPDVSale: hasPermission(PERMISSIONS.PDV_CANCEL_SALE),
      
      // Usuários
      canViewUsers: hasPermission(PERMISSIONS.USERS_VIEW),
      canManageUsers: hasPermission(PERMISSIONS.USERS_MANAGE),
      
      // Roles
      isAdmin: hasRole(USER_ROLES.ADMIN),
      isManager: hasRole(USER_ROLES.MANAGER),
      isOperator: hasRole(USER_ROLES.OPERATOR),
      isViewer: hasRole(USER_ROLES.VIEWER),
      
      // Grupos de permissões
      canManageInventory: hasPermission(PERMISSIONS.PRODUCTS_EDIT) && hasPermission(PERMISSIONS.STOCK_EDIT),
      canManageStore: hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
      canOperateOnly: hasRole(USER_ROLES.OPERATOR) && !hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
      
      // Permissões específicas por contexto
      canModifyPrices: hasPermission(PERMISSIONS.PRODUCTS_EDIT),
      canViewFinancials: hasPermission(PERMISSIONS.REPORTS_VIEW) || hasPermission(PERMISSIONS.SALES_VIEW),
      canManageSystem: hasRole(USER_ROLES.ADMIN)
    };
  }, [user, hasPermission, hasRole, hasAnyRole, PERMISSIONS, USER_ROLES]);

  // Função para verificar múltiplas permissões
  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => hasPermission(permission));
  };

  // Função para verificar se tem pelo menos uma permissão
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => hasPermission(permission));
  };

  // Função para verificar permissão com fallback
  const checkPermission = (permission, fallback = false) => {
    if (!user) return fallback;
    return hasPermission(permission);
  };

  // Função para obter nível de acesso numérico (para comparações)
  const getAccessLevel = () => {
    if (!user) return 0;
    
    switch (user.role) {
      case USER_ROLES.ADMIN:
        return 4;
      case USER_ROLES.MANAGER:
        return 3;
      case USER_ROLES.OPERATOR:
        return 2;
      case USER_ROLES.VIEWER:
        return 1;
      default:
        return 0;
    }
  };

  // Função para verificar se tem nível de acesso mínimo
  const hasMinimumAccessLevel = (requiredLevel) => {
    const currentLevel = getAccessLevel();
    return currentLevel >= requiredLevel;
  };

  // Função para filtrar itens de menu baseado em permissões
  const filterMenuItems = (menuItems) => {
    return menuItems.filter(item => {
      if (!item.requiredPermission && !item.requiredRole) return true;
      
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
        return false;
      }
      
      if (item.requiredRole && !hasRole(item.requiredRole)) {
        return false;
      }
      
      return true;
    });
  };

  // Função para verificar se pode acessar uma rota
  const canAccessRoute = (routeConfig) => {
    if (!routeConfig) return true;
    
    const { requiredPermission, requiredRole, requiredRoles } = routeConfig;
    
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }
    
    if (requiredRole && !hasRole(requiredRole)) {
      return false;
    }
    
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      return false;
    }
    
    return true;
  };

  return {
    ...permissions,
    user,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
    checkPermission,
    getAccessLevel,
    hasMinimumAccessLevel,
    filterMenuItems,
    canAccessRoute,
    PERMISSIONS,
    USER_ROLES
  };
}

// Hook específico para componentes que precisam de permissões específicas
export function useRequiredPermissions(requiredPermissions = []) {
  const { hasAllPermissions, hasAnyPermission } = usePermissions();
  
  const hasRequired = hasAllPermissions(requiredPermissions);
  const hasAny = hasAnyPermission(requiredPermissions);
  
  return {
    hasRequired,
    hasAny,
    canProceed: hasRequired
  };
}

// Hook para verificar se é uma área administrativa
export function useIsAdminArea() {
  const { isAdmin, isManager } = usePermissions();
  
  return {
    isAdminArea: isAdmin || isManager,
    isAdmin,
    isManager
  };
}