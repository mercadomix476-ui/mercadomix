import React from 'react';
import { Settings, Database, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCacheManager from '@/components/admin/ProductCacheManager';
import { CacheStatus } from '@/components/ui/cache-status';

/**
 * Página de administração do cache
 * Exemplo de como integrar o ProductCacheManager
 */
export default function CacheAdmin() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administração do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie o cache de produtos e configurações offline</p>
        </div>
        
        {/* Status compacto no header */}
        <CacheStatus compact={true} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cache" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cache de Produtos
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Conectividade
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-6">
          <ProductCacheManager />
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status da Conexão</CardTitle>
              </CardHeader>
              <CardContent>
                <CacheStatus />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Rede</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Sincronização Automática:</span>
                    <span className="text-green-600">Ativada</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Intervalo de Sync:</span>
                    <span>30 minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retry em Falhas:</span>
                    <span>5 minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho Máximo do Cache:</span>
                    <span>50 MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configurações avançadas do sistema de cache offline.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo de Sincronização</label>
                    <select className="w-full p-2 border rounded">
                      <option value="15">15 minutos</option>
                      <option value="30" selected>30 minutos</option>
                      <option value="60">1 hora</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tamanho Máximo do Cache</label>
                    <select className="w-full p-2 border rounded">
                      <option value="25">25 MB</option>
                      <option value="50" selected>50 MB</option>
                      <option value="100">100 MB</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Opções Avançadas</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Sincronização automática ao conectar</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Notificações de sincronização</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-sm">Modo debug (logs detalhados)</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}