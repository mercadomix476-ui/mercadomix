import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield } from 'lucide-react';

export function SuperAdminBadge({ className = "" }) {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300 ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      Super Admin
    </Badge>
  );
}

export function SuperAdminIndicator({ showText = true, size = "sm" }) {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin()) {
    return null;
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center gap-1 text-yellow-600">
      <Shield className={iconSize} />
      {showText && <span className="text-xs font-medium">Super Admin</span>}
    </div>
  );
}