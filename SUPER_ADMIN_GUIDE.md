# Guia do Super Administrador - Nexus Commerce

## 📋 Visão Geral

O sistema de Super Administrador permite que um usuário específico (`ederportelalima@hotmail.com`) tenha acesso total a todas as empresas/tenants do sistema Nexus Commerce, funcionando como um administrador global.

## 🔧 Configuração

### 1. Executar o Script SQL

Execute o arquivo `setup_super_admin.sql` no SQL Editor do Supabase:

```sql
-- Este script irá:
-- 1. Adicionar coluna is_super_admin na tabela profiles
-- 2. Criar função is_super_admin()
-- 3. Configurar ederportelalima@hotmail.com como super admin
-- 4. Atualizar todas as políticas RLS
-- 5. Criar triggers automáticos
```

### 2. Executar o Script JavaScript (Opcional)

Para verificar e configurar via código:

```bash
node scripts/setup_super_admin.js
```

## 🌟 Funcionalidades do Super Admin

### Acesso Total
- **Todos os Tenants**: Vê e pode gerenciar todas as empresas
- **Todos os Dados**: Acesso completo a produtos, vendas, estoque, etc.
- **Todas as Configurações**: Pode alterar configurações de qualquer empresa
- **Criação de Empresas**: Pode criar novas empresas para clientes

### Interface Especial
- **Badge Dourado**: Identificação visual como Super Admin
- **Seletor de Empresa**: Mostra "Acesso Total" e permite alternar entre empresas
- **Menu de Usuário**: Indica status especial com ícone de coroa

### Permissões Automáticas
- **Novos Tenants**: Automaticamente adicionado a novas empresas criadas
- **Bypass RLS**: Políticas de segurança permitem acesso total
- **Todas as Permissões**: Herda automaticamente todas as permissões do sistema

## 🔒 Segurança

### Políticas RLS Atualizadas
Todas as políticas de Row Level Security foram atualizadas para incluir:

```sql
is_super_admin() OR [condição_normal]
```

### Função de Verificação
```sql
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_super_admin = TRUE 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📊 Monitoramento

### Verificar Status do Super Admin
```sql
SELECT 
    p.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active,
    COUNT(tu.tenant_id) as tenants_count
FROM profiles p
LEFT JOIN tenant_users tu ON p.id = tu.user_id
WHERE p.is_super_admin = TRUE
GROUP BY p.id, p.email, p.full_name, p.role, p.is_super_admin, p.is_active;
```

### Verificar Acesso aos Tenants
```sql
SELECT 
    t.name as tenant_name,
    tu.role,
    tu.active,
    tu.created_at
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
JOIN profiles p ON tu.user_id = p.id
WHERE p.is_super_admin = TRUE
ORDER BY t.name;
```

## 🎯 Como Usar

### Para o Super Admin (ederportelalima@hotmail.com)

1. **Login Normal**: Faça login com suas credenciais normais
2. **Seletor de Empresa**: Use o seletor na sidebar para alternar entre empresas
3. **Acesso Total**: Todas as funcionalidades estarão disponíveis
4. **Criação de Empresas**: Use o botão "Nova Empresa" para criar empresas para clientes

### Alternando Entre Empresas
- **Todas as Empresas**: Selecione a opção "🌐 Todas as Empresas" para ver dados agregados
- **Empresa Específica**: Selecione uma empresa para focar nos dados dela
- **Contexto Automático**: O sistema automaticamente filtra os dados baseado na seleção

## 🔄 Triggers Automáticos

### Novos Tenants
Quando uma nova empresa é criada, o super admin é automaticamente adicionado:

```sql
CREATE TRIGGER trigger_add_super_admin_to_new_tenant
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_super_admin_to_new_tenant();
```

## 🛠️ Manutenção

### Adicionar Outro Super Admin
Para adicionar outro usuário como super admin:

```sql
-- Substitua 'novo-email@exemplo.com' pelo email do usuário
UPDATE profiles 
SET 
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE
WHERE email = 'novo-email@exemplo.com';

-- Adicionar aos tenants existentes
SELECT add_super_admin_to_all_tenants();
```

### Remover Super Admin
```sql
UPDATE profiles 
SET 
    role = 'admin',  -- ou outro role apropriado
    is_super_admin = FALSE
WHERE email = 'usuario@exemplo.com';
```

## 🚨 Considerações Importantes

### Responsabilidade
- Super admins têm acesso total ao sistema
- Use com responsabilidade e apenas para suporte/administração
- Mantenha as credenciais seguras

### Auditoria
- Todas as ações são registradas normalmente
- O campo `created_by` e `updated_by` mostrarão o ID do super admin
- Considere implementar logs específicos para ações de super admin

### Backup
- Sempre faça backup antes de modificar permissões
- Teste em ambiente de desenvolvimento primeiro

## 📞 Suporte

Para questões sobre o sistema de Super Admin:
1. Verifique os logs do Supabase
2. Execute as queries de verificação
3. Consulte este guia para troubleshooting

---

**Nota**: Este sistema foi projetado especificamente para `ederportelalima@hotmail.com` ter acesso administrativo total ao Nexus Commerce multi-tenant.