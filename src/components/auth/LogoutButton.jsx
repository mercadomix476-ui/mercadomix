import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function LogoutButton({ 
  variant = "ghost", 
  size = "sm", 
  className = "",
  showText = true,
  ...props 
}) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      aria-label="Fazer logout do sistema"
      {...props}
    >
      <LogOut className="w-5 h-5 flex-shrink-0" />
      {showText && (
        <span className="text-sm">
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </span>
      )}
    </Button>
  );
}

export default LogoutButton;