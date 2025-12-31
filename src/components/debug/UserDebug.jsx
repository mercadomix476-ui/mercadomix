import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/supabaseService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  User, 
  Database, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function UserDebug() {
  const { user, checkUser, USER_ROLES } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    const info = {};

    try {
      // 1. Verificar usuário atual do Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      info.authUser = authUser;
      info.authError = authError;

      if (authUser) {
        // 2. Verificar se existe perfil na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        info.profile = profile;
        info.profileError = profileError;

        // 3. Testar a função me() da API
        try {
          const meResult = await api.auth.me();
          info.meResult = meResult;
        } catch (meError) {
          info.meError = meError;
        }

        // 4. Verificar localStorage
        info.localStorage = {
          auth_user: localStorage.getItem('auth_user'),
          auth_expiry: localStorage.getItem('auth_expiry')
        };

        // 5. Verificar tabela profiles (geral)
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
        
        info.allProfiles = allProfiles;
        info.allProfilesError = allProfilesError;
      }

    } catch (error) {
      info.generalError = error;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  const createProfile = async () => {
    if (!debugInfo.authUser) {
      alert('Usuário não logado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: debugInfo.authUser.id,
          email: debugInfo.authUser.email,
          full_name: debugInfo.authUser.user_metadata?.full_name || debugInfo.authUser.email.split('@')[0],
          role: 'admin',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      alert('Perfil criado com sucesso!');
      runDebug();
      checkUser(); // Atualizar contexto
    } catch (error) {
      alert(`Erro ao criar perfil: ${error.message}`);
    }
  };

  const updateToAdmin = async () => {
    if (!debugInfo.authUser) {
      alert('Usuário não logado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', debugInfo.authUser.id)
        .select()
        .single();

      if (error) throw error;

      alert('Role atualizada para admin!');
      runDebug();
      checkUser(); // Atualizar contexto
    } catch (error) {
      alert(`Erro ao atualizar role: ${error.message}`);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_expiry');
    alert('Cache limpo! Recarregue a página.');
  };

  useEffect(() => {
    runDebug();
  }, []);

  const StatusIcon = ({ condition }) => {
    if (condition === true) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (condition === false) return <XCircle className="w-4 h-4 text-red-600" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bug className="w-6 h-6" />
          Debug do Usuário Admin
        </h2>
        <Button onClick={runDebug} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Status Atual do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusIcon condition={!!user} />
              <span>Usuário logado no contexto: {user ? 'Sim' : 'Não'}</span>
            </div>
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <StatusIcon condition={user.role === USER_ROLES.ADMIN} />
                  <span>Role atual: </span>
                  <Badge variant={user.role === USER_ROLES.ADMIN ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Email: {user.email}
                </div>
                <div className="text-sm text-gray-600">
                  Nome: {user.full_name || 'Não definido'}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Informações de Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Auth User */}
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <StatusIcon condition={!!debugInfo.authUser} />
                Usuário Supabase Auth
              </h4>
              {debugInfo.authUser ? (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify({
                    id: debugInfo.authUser.id,
                    email: debugInfo.authUser.email,
                    created_at: debugInfo.authUser.created_at
                  }, null, 2)}
                </pre>
              ) : (
                <p className="text-red-600 text-sm">Usuário não encontrado no Auth</p>
              )}
            </div>

            {/* Profile */}
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <StatusIcon condition={!!debugInfo.profile} />
                Perfil na Tabela Profiles
              </h4>
              {debugInfo.profile ? (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(debugInfo.profile, null, 2)}
                </pre>
              ) : debugInfo.profileError ? (
                <div className="text-red-600 text-sm">
                  Erro: {debugInfo.profileError.message}
                  {debugInfo.profileError.code === 'PGRST116' && (
                    <div className="mt-2">
                      <Button onClick={createProfile} size="sm">
                        Criar Perfil Admin
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Carregando...</p>
              )}
            </div>

            {/* API me() Result */}
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <StatusIcon condition={!!debugInfo.meResult} />
                Resultado da API me()
              </h4>
              {debugInfo.meResult ? (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify({
                    id: debugInfo.meResult.id,
                    email: debugInfo.meResult.email,
                    role: debugInfo.meResult.role,
                    full_name: debugInfo.meResult.full_name
                  }, null, 2)}
                </pre>
              ) : debugInfo.meError ? (
                <p className="text-red-600 text-sm">Erro: {debugInfo.meError.message}</p>
              ) : (
                <p className="text-gray-600 text-sm">Não executado</p>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              {debugInfo.profile && debugInfo.profile.role !== 'admin' && (
                <Button onClick={updateToAdmin} variant="outline">
                  Definir como Admin
                </Button>
              )}
              <Button onClick={clearCache} variant="outline">
                Limpar Cache
              </Button>
              <Button onClick={() => checkUser()} variant="outline">
                Recarregar Usuário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Todos os Perfis */}
      {debugInfo.allProfiles && (
        <Card>
          <CardHeader>
            <CardTitle>Todos os Perfis ({debugInfo.allProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugInfo.allProfiles.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{profile.email}</span>
                    <Badge variant="outline" className="ml-2">
                      {profile.role}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {profile.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}