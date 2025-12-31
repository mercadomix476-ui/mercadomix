import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { TenantSelector } from './TenantSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield } from 'lucide-react';

export default function TenantGuard({ children }) {
  const { currentTenant, userTenants, loading } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto text-emerald-600 animate-pulse mb-4" />
          <p className="text-slate-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  // Se não há tenants, mostrar tela de criação
  if (userTenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle>Bem-vindo ao Sistema Multi-Empresas</CardTitle>
            <CardDescription>
              Para começar, você precisa criar sua primeira empresa ou ser convidado para uma empresa existente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <TenantSelector />
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-blue-800 text-sm">Isolamento de Dados</p>
                  <p className="text-blue-700 text-xs mt-1">
                    Cada empresa tem seus próprios dados completamente isolados. 
                    Produtos, vendas e configurações são únicos por empresa.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se há tenants mas nenhum selecionado, mostrar seletor
  if (!currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle>Selecionar Empresa</CardTitle>
            <CardDescription>
              Você tem acesso a {userTenants.length} empresa{userTenants.length > 1 ? 's' : ''}. 
              Selecione uma para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <TenantSelector />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tudo está ok, renderizar o conteúdo
  return children;
}