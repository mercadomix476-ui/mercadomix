import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, Lock } from 'lucide-react';

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole, 
  requiredRoles, 
  fallback,
  redirectTo = '/login' 
}) {
  const { user, loading, hasPermission, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        role="status" 
        aria-live="polite" 
        className="flex flex-col items-center justify-center min-h-screen gap-4"
      >
        <LoadingSpinner size="xl" className="text-emerald-600" />
        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">Verificando permissões...</p>
          <p className="text-sm text-slate-500">Aguarde um momento</p>
        </div>
        <span className="sr-only">Verificando permissões de acesso...</span>
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar permissão específica
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <AccessDenied type="permission" required={requiredPermission} />;
  }

  // Verificar role específica
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || <AccessDenied type="role" required={requiredRole} />;
  }

  // Verificar se tem pelo menos uma das roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || <AccessDenied type="roles" required={requiredRoles} />;
  }

  return children;
}

export function RequirePermission({ permission, children, fallback }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback || <AccessDenied type="permission" required={permission} />;
  }

  return children;
}

export function RequireRole({ role, children, fallback }) {
  const { hasRole } = useAuth();

  if (!hasRole(role)) {
    return fallback || <AccessDenied type="role" required={role} />;
  }

  return children;
}

export function RequireAnyRole({ roles, children, fallback }) {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(roles)) {
    return fallback || <AccessDenied type="roles" required={roles} />;
  }

  return children;
}

function AccessDenied({ type, required }) {
  const { user } = useAuth();

  const getTitle = () => {
    switch (type) {
      case 'permission':
        return 'Permissão Necessária';
      case 'role':
        return 'Nível de Acesso Insuficiente';
      case 'roles':
        return 'Acesso Restrito';
      default:
        return 'Acesso Negado';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'permission':
        return `Você não possui a permissão "${required}" necessária para acessar esta funcionalidade.`;
      case 'role':
        return `Esta funcionalidade requer o nível de acesso "${required}". Seu nível atual é "${user?.role}".`;
      case 'roles':
        return `Esta funcionalidade requer um dos seguintes níveis de acesso: ${required.join(', ')}. Seu nível atual é "${user?.role}".`;
      default:
        return 'Você não tem permissão para acessar esta área.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{getTitle()}</h1>
        </div>

        <Alert variant="destructive" className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {getMessage()}
          </AlertDescription>
        </Alert>

        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          <p className="font-medium mb-2">Informações da sua conta:</p>
          <ul className="space-y-1">
            <li>Usuário: {user?.full_name || user?.email}</li>
            <li>Nível de acesso: {user?.role}</li>
            <li>Permissões: {user?.permissions?.length || 0} ativas</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Entre em contato com o administrador do sistema para solicitar as permissões necessárias.
          </p>
        </div>
      </div>
    </div>
  );
}