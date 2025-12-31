# Configuração Super Admin - Passo a Passo

Execute cada comando abaixo **um por vez** no SQL Editor do Supabase:

## Passo 1: Adicionar coluna is_super_admin

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
```

## Passo 2: Criar função de verificação

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

## Passo 3: Encontrar o ID do usuário

```sql
SELECT id, email FROM auth.users WHERE email = 'ederportelalima@hotmail.com';
```

**Copie o ID retornado** e use no próximo passo.

## Passo 4: Configurar como super admin

**Substitua `SEU_USER_ID_AQUI` pelo ID copiado do passo anterior:**

```sql
INSERT INTO profiles (id, email, full_name, role, is_active, is_super_admin)
VALUES (
    'SEU_USER_ID_AQUI',
    'ederportelalima@hotmail.com',
    'Eder Portal - Super Admin',
    'super_admin',
    TRUE,
    TRUE
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'super_admin',
    is_active = TRUE,
    is_super_admin = TRUE,
    updated_at = NOW();
```

## Passo 5: Atualizar política de tenants (visualização)

```sql
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        is_super_admin() OR
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );
```

## Passo 6: Atualizar política de tenants (edição)

```sql
DROP POLICY IF EXISTS "Tenant owners can update their tenants" ON tenants;
CREATE POLICY "Tenant owners can update their tenants" ON tenants
    FOR UPDATE USING (
        is_super_admin() OR
        auth.uid() = owner_id
    );
```

## Passo 7: Atualizar política de tenant_users (visualização)

```sql
DROP POLICY IF EXISTS "Users can view their tenant relationships" ON tenant_users;
CREATE POLICY "Users can view their tenant relationships" ON tenant_users
    FOR SELECT USING (
        is_super_admin() OR
        user_id = auth.uid()
    );
```

## Passo 8: Atualizar política de tenant_users (gerenciamento)

```sql
DROP POLICY IF EXISTS "Tenant owners can manage tenant users" ON tenant_users;
CREATE POLICY "Tenant owners can manage tenant users" ON tenant_users
    FOR ALL USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );
```

## Passo 9: Verificar se funcionou

```sql
SELECT 
    p.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active
FROM profiles p
WHERE p.is_super_admin = TRUE;
```

## Passo 10: Adicionar super admin aos tenants existentes

**Substitua `SEU_USER_ID_AQUI` pelo mesmo ID do Passo 4:**

```sql
INSERT INTO tenant_users (tenant_id, user_id, role, active)
SELECT 
    t.id,
    'SEU_USER_ID_AQUI',
    'super_admin',
    TRUE
FROM tenants t
WHERE t.active = TRUE
ON CONFLICT (tenant_id, user_id) 
DO UPDATE SET 
    role = 'super_admin',
    active = TRUE,
    updated_at = NOW();
```

## ✅ Verificação Final

Execute esta query para confirmar que tudo está funcionando:

```sql
SELECT 
    p.email,
    p.full_name,
    p.is_super_admin,
    COUNT(tu.tenant_id) as tenants_count
FROM profiles p
LEFT JOIN tenant_users tu ON p.id = tu.user_id
WHERE p.is_super_admin = TRUE
GROUP BY p.id, p.email, p.full_name, p.is_super_admin;
```

Se retornar uma linha com `is_super_admin = true` e `tenants_count > 0`, a configuração está completa!

## 🚨 Importante

- Execute **um comando por vez**
- Aguarde cada comando terminar antes do próximo
- Se algum comando der erro, pare e verifique antes de continuar
- Guarde o ID do usuário do Passo 3 para usar nos Passos 4 e 10