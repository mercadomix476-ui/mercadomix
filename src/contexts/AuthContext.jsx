import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api as base44 } from '@/api/supabaseService';
import { toast } from 'sonner';

// Definição de roles e permissões
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager', 
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // Produtos
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  
  // Vendas
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_CANCEL: 'sales:cancel',
  
  // Estoque
  STOCK_VIEW: 'stock:view',
  STOCK_EDIT: 'stock:edit',
  STOCK_HISTORY: 'stock:history',
  
  // Relatórios
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Configurações
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // PDV
  PDV_ACCESS: 'pdv:access',
  PDV_DISCOUNT: 'pdv:discount',
  PDV_CANCEL_SALE: 'pdv:cancel_sale',
  
  // Usuários
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  
  // Super Admin - Permissões especiais
  SUPER_ADMIN_ACCESS: 'super_admin:access',
  ALL_TENANTS_ACCESS: 'tenants:all_access',
  SYSTEM_MANAGEMENT: 'system:management'
};

// Mapeamento de roles para permissões
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Super admin tem todas as permissões
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS).filter(p => !p.startsWith('super_admin:') && !p.startsWith('tenants:all') && !p.startsWith('system:')),
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_CANCEL,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_EDIT,
    PERMISSIONS.STOCK_HISTORY,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.PDV_ACCESS,
    PERMISSIONS.PDV_DISCOUNT,
    PERMISSIONS.PDV_CANCEL_SALE
  ],
  [USER_ROLES.OPERATOR]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.PDV_ACCESS
  ],
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ]
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);

  // Verificar usuário atual
  const checkUser = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await base44.auth.me();
      
      if (userData) {
        // O userData já vem com o perfil do banco de dados
        const userWithPermissions = {
          ...userData,
          permissions: ROLE_PERMISSIONS[userData.role] || []
        };
        
        setUser(userWithPermissions);
        
        // Configurar expiração da sessão (24 horas)
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24);
        setSessionExpiry(expiryTime);
        
        // Salvar no localStorage para persistência
        localStorage.setItem('auth_user', JSON.stringify(userWithPermissions));
        localStorage.setItem('auth_expiry', expiryTime.toISOString());
      } else {
        setUser(null);
        setSessionExpiry(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_expiry');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      // Não limpar o usuário em caso de erro de rede
      // Apenas se for erro de autenticação
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        setUser(null);
        setSessionExpiry(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_expiry');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const { user: userData, error } = await base44.auth.login(email, password);
      
      if (error) {
        throw new Error(error.message || 'Credenciais inválidas');
      }
      
      if (userData) {
        // Aguardar um pouco para o Supabase processar a sessão
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Buscar dados completos do usuário
        try {
          const fullUserData = await base44.auth.me();
          const userWithPermissions = {
            ...fullUserData,
            permissions: ROLE_PERMISSIONS[fullUserData.role] || []
          };
          
          setUser(userWithPermissions);
          
          // Configurar expiração da sessão
          const expiryTime = new Date();
          expiryTime.setHours(expiryTime.getHours() + 24);
          setSessionExpiry(expiryTime);
          
          // Salvar no localStorage
          localStorage.setItem('auth_user', JSON.stringify(userWithPermissions));
          localStorage.setItem('auth_expiry', expiryTime.toISOString());
          
          toast.success('Login realizado com sucesso!');
          return { success: true };
        } catch (profileError) {
          console.error('Erro ao buscar perfil após login:', profileError);
          // Mesmo com erro no perfil, manter o login básico
          const basicUser = {
            ...userData,
            role: 'operator',
            permissions: ROLE_PERMISSIONS['operator'] || []
          };
          setUser(basicUser);
          toast.success('Login realizado com sucesso!');
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = error.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos' 
        : error.message || 'Erro ao fazer login';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await base44.auth.logout();
      setUser(null);
      setSessionExpiry(null);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_expiry');
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  }, []);

  // Verificar se usuário tem permissão
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    // Super admins têm todas as permissões
    if (user.role === USER_ROLES.SUPER_ADMIN || user.is_super_admin) return true;
    return user.permissions?.includes(permission) || false;
  }, [user]);

  // Verificar se usuário tem role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Verificar se usuário tem pelo menos uma das roles
  const hasAnyRole = useCallback((roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  // Verificar se usuário é super admin
  const isSuperAdmin = useCallback(() => {
    if (!user) return false;
    return user.role === USER_ROLES.SUPER_ADMIN || user.is_super_admin === true;
  }, [user]);

  // Verificar se usuário tem acesso a todos os tenants
  const hasAllTenantsAccess = useCallback(() => {
    return isSuperAdmin();
  }, [isSuperAdmin]);

  // Verificar se sessão expirou
  const isSessionExpired = useCallback(() => {
    if (!sessionExpiry) return true;
    return new Date() > new Date(sessionExpiry);
  }, [sessionExpiry]);

  // Renovar sessão
  const renewSession = useCallback(async () => {
    if (isSessionExpired()) {
      await logout();
      toast.warning('Sessão expirada. Faça login novamente.');
      return false;
    }
    
    // Renovar por mais 24 horas
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + 24);
    setSessionExpiry(newExpiry);
    localStorage.setItem('auth_expiry', newExpiry.toISOString());
    return true;
  }, [isSessionExpired, logout]);

  // Verificar sessão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && isSessionExpired()) {
        logout();
        toast.warning('Sessão expirada. Faça login novamente.');
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [user, isSessionExpired, logout]);

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('auth_user');
      const savedExpiry = localStorage.getItem('auth_expiry');
      
      if (savedUser && savedExpiry) {
        const expiryDate = new Date(savedExpiry);
        if (new Date() < expiryDate) {
          try {
            // Usar dados salvos primeiro, depois verificar no servidor
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setSessionExpiry(expiryDate);
            setLoading(false);
            
            // Verificar no servidor em background (sem bloquear a UI)
            setTimeout(async () => {
              try {
                const userData = await base44.auth.me();
                if (userData) {
                  const userWithPermissions = {
                    ...userData,
                    permissions: ROLE_PERMISSIONS[userData.role] || []
                  };
                  setUser(userWithPermissions);
                  localStorage.setItem('auth_user', JSON.stringify(userWithPermissions));
                }
              } catch (error) {
                // Se falhar, manter usuário salvo (pode ser problema de rede)
                console.warn('Verificação em background falhou:', error);
              }
            }, 1000);
            
            return;
          } catch (error) {
            console.error('Erro ao carregar usuário salvo:', error);
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_expiry');
          }
        } else {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_expiry');
        }
      }
      
      // Se não há usuário salvo, apenas definir loading como false
      // NÃO tentar verificar no servidor se não há sessão
      setUser(null);
      setLoading(false);
    };

    initializeAuth();
  }, []); // Remover checkUser da dependência para evitar loops

  // Interceptar requisições para renovar sessão
  useEffect(() => {
    if (user) {
      const interceptor = setInterval(() => {
        renewSession();
      }, 30 * 60 * 1000); // Renovar a cada 30 minutos

      return () => clearInterval(interceptor);
    }
  }, [user, renewSession]);

  const value = {
    user,
    loading,
    sessionExpiry,
    login,
    logout,
    checkUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    hasAllTenantsAccess,
    isSessionExpired,
    renewSession,
    // Constantes para uso nos componentes
    USER_ROLES,
    PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}