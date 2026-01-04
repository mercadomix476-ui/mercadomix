import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Shield, 
  ChevronDown,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuperAdminBadge } from '@/components/admin/SuperAdminBadge';

export function SimpleUserMenu() {
  const { user, USER_ROLES, isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  if (!user) return null;

  // Calcular posição do dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 200;
      
      if (rect.bottom + dropdownHeight > windowHeight - 50) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getRoleBadgeColor = (role) => {
    const colors = {
      [USER_ROLES.SUPER_ADMIN]: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300',
      [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
      [USER_ROLES.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
      [USER_ROLES.OPERATOR]: 'bg-green-100 text-green-800 border-green-200',
      [USER_ROLES.VIEWER]: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getRoleLabel = (role) => {
    const labels = {
      [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
      [USER_ROLES.ADMIN]: 'Administrador',
      [USER_ROLES.MANAGER]: 'Gerente',
      [USER_ROLES.OPERATOR]: 'Operador',
      [USER_ROLES.VIEWER]: 'Visualizador'
    };
    return labels[role] || role;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
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
        <ChevronDown 
          className={`w-4 h-4 text-white/60 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          aria-hidden="true" 
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          ref={menuRef}
          className={`absolute right-0 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-[9999] ${
            dropdownPosition === 'top' 
              ? 'bottom-full mb-2' 
              : 'top-full mt-2'
          }`}
          style={{
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          {/* Header do usuário */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
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
                  {isSuperAdmin() ? <Crown className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                  {getRoleLabel(user.role)}
                </Badge>
                {isSuperAdmin() && (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    🌐 Acesso a todas as empresas
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {/* Logout removido - agora está na sidebar */}
          </div>
        </div>
      )}
    </div>
  );
}