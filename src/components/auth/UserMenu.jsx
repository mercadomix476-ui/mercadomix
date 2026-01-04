import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Shield, 
  Clock, 
  ChevronDown,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, logout, sessionExpiry, USER_ROLES } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
      console.error('Erro no logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case USER_ROLES.MANAGER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case USER_ROLES.OPERATOR:
        return 'bg-green-100 text-green-800 border-green-200';
      case USER_ROLES.VIEWER:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Administrador';
      case USER_ROLES.MANAGER:
        return 'Gerente';
      case USER_ROLES.OPERATOR:
        return 'Operador';
      case USER_ROLES.VIEWER:
        return 'Visualizador';
      default:
        return role;
    }
  };

  const getSessionTimeLeft = () => {
    if (!sessionExpiry) return 'Indefinido';
    
    try {
      return formatDistanceToNow(new Date(sessionExpiry), {
        locale: ptBR,
        addSuffix: true
      });
    } catch {
      return 'Indefinido';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 w-full p-2 hover:bg-[#2D6A4F]/30 rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1B4332]"
          aria-label={`Menu do usuário - ${user.full_name || user.email}`}
        >
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white border-2 border-[#40916C] flex-shrink-0"
            role="img"
            aria-label="Avatar do usuário"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-white">
              {user.full_name || user.email}
            </p>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs h-4 ${getRoleBadgeColor(user.role)} border`}
              >
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-white/60 flex-shrink-0" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header do usuário */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">
                {user.full_name || 'Usuário'}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {user.email}
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs mt-1 ${getRoleBadgeColor(user.role)}`}
              >
                <Shield className="w-3 h-3 mr-1" />
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Informações da sessão */}
        <div className="p-3 border-b border-slate-200 bg-blue-50">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Clock className="w-4 h-4" />
            <span>Sessão expira {getSessionTimeLeft()}</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {user.permissions?.length || 0} permissões ativas
          </div>
        </div>

        {/* Menu items */}
        <div className="p-1">
          <DropdownMenuItem className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-100">
            <Settings className="w-4 h-4" />
            <span>Configurações da Conta</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-100">
            <HelpCircle className="w-4 h-4" />
            <span>Ajuda e Suporte</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem 
            className="flex items-center gap-3 p-3 cursor-pointer border-t border-red-100 bg-white hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{ 
              color: '#dc2626',
              fontWeight: '600'
            }}
          >
            <LogOut 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: '#dc2626' }} 
            />
            <span 
              className="text-sm" 
              style={{ 
                color: '#dc2626',
                fontWeight: '600'
              }}
            >
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserInfo() {
  const { user, USER_ROLES } = useAuth();

  if (!user) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'text-purple-600';
      case USER_ROLES.MANAGER:
        return 'text-blue-600';
      case USER_ROLES.OPERATOR:
        return 'text-green-600';
      case USER_ROLES.VIEWER:
        return 'text-gray-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <User className="w-4 h-4 text-slate-400" />
      <span className="text-slate-600">{user.full_name || user.email}</span>
      <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
        {user.role}
      </Badge>
    </div>
  );
}