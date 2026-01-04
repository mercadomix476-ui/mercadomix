import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api as base44 } from '@/api/supabaseService';
import { toast } from 'sonner';

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userTenants, setUserTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar tenants do usuário
  const fetchUserTenants = useCallback(async () => {
    if (!user) {
      setUserTenants([]);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar tenants reais do banco de dados
      const tenants = await base44.entities.Tenant.list();
      
      if (!tenants || tenants.length === 0) {
        // Se não há tenants, criar um padrão
        console.log('Nenhum tenant encontrado, usando dados padrão');
        const mockTenants = [
          {
            id: 'tenant-1',
            name: 'Mercadinho Central',
            role: user.role === 'super_admin' ? 'super_admin' : 'admin',
            permissions: []
          }
        ];
        setUserTenants(mockTenants);
        
        if (mockTenants.length === 1) {
          setCurrentTenant(mockTenants[0]);
          localStorage.setItem('current_tenant_id', mockTenants[0].id);
        }
      } else {
        // Mapear tenants reais
        const mappedTenants = tenants.map(tenant => ({
          id: tenant.id,
          name: tenant.name,
          role: user.role === 'super_admin' ? 'super_admin' : (tenant.role || 'admin'),
          permissions: tenant.permissions || []
        }));
        
        setUserTenants(mappedTenants);
        
        // Se há apenas um tenant, selecionar automaticamente
        if (mappedTenants.length === 1) {
          setCurrentTenant(mappedTenants[0]);
          localStorage.setItem('current_tenant_id', mappedTenants[0].id);
        } else if (mappedTenants.length > 1) {
          // Tentar carregar tenant salvo
          const savedTenantId = localStorage.getItem('current_tenant_id');
          const savedTenant = mappedTenants.find(t => t.id === savedTenantId);
          if (savedTenant) {
            setCurrentTenant(savedTenant);
          } else {
            // Se super admin e nenhum tenant selecionado, não selecionar nenhum (ver todos)
            if (user.role !== 'super_admin') {
              setCurrentTenant(mappedTenants[0]);
              localStorage.setItem('current_tenant_id', mappedTenants[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tenants:', error);
      
      // Fallback para dados mock em caso de erro
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Mercadinho Central',
          role: user.role === 'super_admin' ? 'super_admin' : 'admin',
          permissions: []
        }
      ];
      setUserTenants(mockTenants);
      
      if (mockTenants.length === 1) {
        setCurrentTenant(mockTenants[0]);
        localStorage.setItem('current_tenant_id', mockTenants[0].id);
      }
      
      toast.error('Erro ao carregar empresas, usando dados padrão');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Selecionar tenant
  const selectTenant = useCallback((tenant) => {
    setCurrentTenant(tenant);
    if (tenant) {
      localStorage.setItem('current_tenant_id', tenant.id);
      toast.success(`Empresa "${tenant.name}" selecionada`);
    } else {
      // Super admin selecionou "todas as empresas"
      localStorage.removeItem('current_tenant_id');
      toast.success('Visualizando todas as empresas');
    }
  }, []);

  // Criar novo tenant
  const createTenant = useCallback(async (tenantData) => {
    try {
      const newTenant = await base44.entities.Tenant.create({
        ...tenantData,
        owner_id: user.id
      });
      
      // Adicionar usuário como admin do tenant
      await base44.entities.TenantUser.create({
        tenant_id: newTenant.id,
        user_id: user.id,
        role: 'admin'
      });
      
      await fetchUserTenants();
      toast.success('Empresa criada com sucesso!');
      return newTenant;
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      toast.error('Erro ao criar empresa');
      throw error;
    }
  }, [user, fetchUserTenants]);

  // Verificar se usuário tem permissão no tenant atual
  const hasPermissionInTenant = useCallback((permission) => {
    if (!user) return false;
    
    // Super admins têm todas as permissões
    if (user.role === 'super_admin' || user.is_super_admin) return true;
    
    if (!currentTenant) return false;
    
    const tenantUser = userTenants.find(t => t.id === currentTenant.id);
    if (!tenantUser) return false;
    
    // Admins têm todas as permissões
    if (tenantUser.role === 'admin') return true;
    
    // Verificar permissões específicas baseadas no role
    return tenantUser.permissions?.includes(permission) || false;
  }, [currentTenant, user, userTenants]);

  useEffect(() => {
    fetchUserTenants();
  }, [fetchUserTenants]);

  const value = {
    currentTenant,
    userTenants,
    loading,
    selectTenant,
    createTenant,
    fetchUserTenants,
    hasPermissionInTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}