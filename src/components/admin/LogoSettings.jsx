import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LogoUpload } from '@/components/admin/LogoUpload';
import { LogoDisplay, SystemLogo } from '@/components/ui/LogoDisplay';
import { logoService } from '@/services/logoService';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { 
  Upload, 
  Trash2, 
  History, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Image,
  Shield
} from 'lucide-react';

/**
 * LogoSettings Component
 * Implements requirements 4.1, 4.2, 4.3 - Logo management interface
 * with current logo display, replacement, removal, and change history
 * Includes proper permissions and access control
 */
export function LogoSettings({ className = "" }) {
  const { user } = useAuth();
  const { canEditSettings, isAdmin, canManageStore } = usePermissions();
  const [currentLogo, setCurrentLogo] = useState(null);
  const [logoHistory, setLogoHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Use a fixed store ID since this is not multi-tenant
  const STORE_ID = 'default-store';

  // Check if user has permission to manage logos
  const canManageLogos = canEditSettings && (isAdmin || canManageStore);

  // Load current logo and history
  useEffect(() => {
    loadLogoData();
  }, []);

  const loadLogoData = async () => {
    setLoading(true);
    try {
      // Load current logo
      const logoResult = await logoService.getCurrentLogo(STORE_ID);
      if (logoResult.success && logoResult.logo) {
        setCurrentLogo(logoResult.logo);
      } else {
        setCurrentLogo(null);
      }

      // Load logo history
      const historyResult = await logoService.getLogoHistory(STORE_ID);
      if (historyResult.success) {
        setLogoHistory(historyResult.history);
      }
    } catch (error) {
      console.error('Error loading logo data:', error);
      toast.error('Erro ao carregar dados do logo');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    toast.success('Logo atualizado com sucesso!');
    setShowUpload(false);
    loadLogoData(); // Reload data
    
    // The logoService already triggers cache invalidation via custom event
    // No additional action needed here as useLogoUpdates hook will handle it
  };

  const handleUploadError = (errors) => {
    toast.error('Erro no upload: ' + errors.join(', '));
  };

  const handleRemoveLogo = async () => {
    if (!user?.id || !canManageLogos) {
      toast.error('Você não tem permissão para remover logos');
      return;
    }

    try {
      const result = await logoService.removeLogo(STORE_ID, user.id);
      
      if (result.success) {
        toast.success('Logo removido com sucesso!');
        setUseSystemLogo(true); // Voltar para logo do sistema
        loadLogoData(); // Reload data
        
        // The logoService already triggers cache invalidation via custom event
        // No additional action needed here as useLogoUpdates hook will handle it
      } else {
        toast.error('Erro ao remover logo: ' + result.errors.join(', '));
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'upload':
        return <Upload className="w-3 h-3" />;
      case 'remove':
        return <Trash2 className="w-3 h-3" />;
      case 'replace':
        return <RefreshCw className="w-3 h-3" />;
      default:
        return <Image className="w-3 h-3" />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'upload':
        return 'Upload';
      case 'remove':
        return 'Remoção';
      case 'replace':
        return 'Substituição';
      default:
        return 'Alteração';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'upload':
        return 'bg-green-100 text-green-800';
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'replace':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show permission denied message if user cannot manage logos
  if (!canManageLogos) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo da Loja
          </CardTitle>
          <CardDescription>
            Configuração de logo personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <LogoDisplay
                logoUrl={currentLogo?.logo_url}
                alt="Logo atual da loja"
                size="xlarge"
                shape="circle"
                className="border-4 border-slate-300 shadow-lg"
              />
            </div>
            <div className="flex-1 space-y-2">
              {currentLogo ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-slate-700">Logo personalizado ativo</span>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p><strong>Arquivo:</strong> {currentLogo.original_filename}</p>
                    <p><strong>Enviado em:</strong> {formatDate(currentLogo.uploaded_at)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-slate-700">Usando logo padrão</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Nenhum logo personalizado foi enviado.
                  </p>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                <strong>Acesso Restrito:</strong> Apenas administradores podem gerenciar logos da loja.
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Nota:</strong> A tela de login sempre usará a logo oficial do Nexus Commerce. 
              Esta configuração afeta apenas o sistema interno após o login.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Logo Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo da Loja
          </CardTitle>
          <CardDescription>
            Configure a logo que aparece no sistema interno (sidebar, páginas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo atual */}
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex-shrink-0">
              <LogoDisplay
                logoUrl={currentLogo?.logo_url}
                alt="Logo atual da loja"
                size="xlarge"
                shape="circle"
                className="border-4 border-emerald-600 shadow-lg"
              />
            </div>
            <div className="flex-1 space-y-2">
              {currentLogo ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-slate-700">Logo personalizada ativa</span>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p><strong>Arquivo:</strong> {currentLogo.original_filename}</p>
                    <p><strong>Tamanho:</strong> {(currentLogo.file_size / 1024).toFixed(1)} KB</p>
                    <p><strong>Enviado em:</strong> {formatDate(currentLogo.uploaded_at)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-slate-700">Usando logo padrão</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Sistema está usando a logo padrão do Nexus Commerce. Faça upload de uma logo personalizada.
                  </p>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!canManageLogos}
            >
              <Upload className="w-4 h-4 mr-2" />
              {currentLogo ? 'Substituir Logo' : 'Enviar Logo'}
            </Button>
            
            {currentLogo && (
              <Button
                variant="outline"
                onClick={handleRemoveLogo}
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={!canManageLogos}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover Logo
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </div>

          {/* Important Note */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>📌 Conceito de Branding:</strong><br/>
              • <strong>Tela de Login:</strong> Sempre mostra a logo do Nexus Commerce (identidade do produto)<br/>
              • <strong>Sistema Interno:</strong> Mostra a logo da sua empresa (experiência personalizada)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      {showUpload && canManageLogos && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentLogo ? 'Substituir Logo' : 'Enviar Novo Logo'}
            </CardTitle>
            <CardDescription>
              Selecione uma imagem para usar como logo da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogoUpload
              storeId={STORE_ID}
              userId={user?.id}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Alterações
            </CardTitle>
            <CardDescription>
              Registro de todas as alterações feitas no logo da loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logoHistory.length > 0 ? (
              <div className="space-y-3">
                {logoHistory.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`${getActionColor(entry.action)} border-0`}>
                        {getActionIcon(entry.action)}
                        <span className="ml-1">{getActionLabel(entry.action)}</span>
                      </Badge>
                      <div className="text-sm">
                        <p className="font-medium text-slate-700">
                          {formatDate(entry.changed_at)}
                        </p>
                        {entry.old_logo_url && entry.new_logo_url && (
                          <p className="text-slate-500">
                            Logo substituído
                          </p>
                        )}
                        {entry.old_logo_url && !entry.new_logo_url && (
                          <p className="text-slate-500">
                            Logo removido
                          </p>
                        )}
                        {!entry.old_logo_url && entry.new_logo_url && (
                          <p className="text-slate-500">
                            Primeiro logo enviado
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      #{entry.id?.slice(-8) || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma alteração registrada</p>
                <p className="text-sm text-slate-400">
                  O histórico aparecerá aqui quando você fizer alterações no logo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}