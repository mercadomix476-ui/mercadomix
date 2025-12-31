import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus } from 'lucide-react';
import { CreateTenantDialog } from './CreateTenantDialog';

export function TenantSelector() {
  const { user, isSuperAdmin } = useAuth();
  const { currentTenant, userTenants, selectTenant, loading } = useTenant();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Building2 className="w-4 h-4 animate-pulse" />
        <span>Carregando empresas...</span>
      </div>
    );
  }

  // Super Admin tem acesso especial
  if (isSuperAdmin()) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Building2 className="w-4 h-4 text-yellow-400" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Super Admin</p>
            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
              Acesso Total
            </Badge>
          </div>
        </div>
        
        {userTenants.length > 0 && (
          <>
            <div className="text-xs text-white/60">Empresa Ativa:</div>
            <Select
              value={currentTenant?.id || 'all'}
              onValueChange={(tenantId) => {
                if (tenantId === 'all') {
                  selectTenant(null); // Super admin vendo todas as empresas
                } else {
                  const tenant = userTenants.find(t => t.id === tenantId);
                  if (tenant) selectTenant(tenant);
                }
              }}
            >
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center justify-between w-full">
                    <span>🌐 Todas as Empresas</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Super Admin
                    </Badge>
                  </div>
                </SelectItem>
                {userTenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tenant.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {tenant.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          variant="outline"
          className="w-full gap-2 border-white/20 text-white hover:bg-white/10"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
        
        <CreateTenantDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      </div>
    );
  }

  if (userTenants.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Criar Primeira Empresa
        </Button>
        <CreateTenantDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      </div>
    );
  }

  if (userTenants.length === 1) {
    return (
      <div className="flex items-center gap-2 text-white">
        <Building2 className="w-4 h-4 text-emerald-400" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{currentTenant?.name}</p>
          <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
            {currentTenant?.role}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-white">
        <Building2 className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-white/60">Empresa Ativa:</span>
      </div>
      
      <Select
        value={currentTenant?.id || ''}
        onValueChange={(tenantId) => {
          const tenant = userTenants.find(t => t.id === tenantId);
          if (tenant) selectTenant(tenant);
        }}
      >
        <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Selecionar empresa" />
        </SelectTrigger>
        <SelectContent>
          {userTenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center justify-between w-full">
                <span>{tenant.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {tenant.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={() => setShowCreateDialog(true)}
        size="sm"
        variant="outline"
        className="w-full gap-2 border-white/20 text-white hover:bg-white/10"
      >
        <Plus className="w-4 h-4" />
        Nova Empresa
      </Button>
      
      <CreateTenantDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}