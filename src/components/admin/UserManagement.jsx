import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/supabaseService';
import { toast } from 'sonner';
import {
  Users,
  Shield,
  Edit,
  Check,
  X,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function UserManagement() {
  const { user, USER_ROLES, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  // Verificar se o usuário é admin
  if (!hasRole(USER_ROLES.ADMIN)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-gray-500">
            Apenas administradores podem acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.entities.Profile.list();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.entities.Profile.updateRole(userId, newRole);
      toast.success('Role do usuário atualizada com sucesso!');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role do usuário');
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

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie roles e permissões dos usuários do sistema
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline">
          Atualizar Lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Usuários Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">
                          {userItem.full_name || 'Sem nome'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      {editingUser === userItem.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue={userItem.role}
                            onValueChange={(newRole) => {
                              updateUserRole(userItem.id, newRole);
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={USER_ROLES.ADMIN}>
                                Administrador
                              </SelectItem>
                              <SelectItem value={USER_ROLES.MANAGER}>
                                Gerente
                              </SelectItem>
                              <SelectItem value={USER_ROLES.OPERATOR}>
                                Operador
                              </SelectItem>
                              <SelectItem value={USER_ROLES.VIEWER}>
                                Visualizador
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={getRoleBadgeColor(userItem.role)}
                        >
                          {getRoleLabel(userItem.role)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={userItem.is_active ? 'default' : 'secondary'}
                      >
                        {userItem.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {editingUser !== userItem.id && userItem.id !== user.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUser(userItem.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {userItem.id === user.id && (
                        <span className="text-sm text-gray-500">Você</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}