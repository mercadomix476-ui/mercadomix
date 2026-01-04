# Configuração Manual Super Admin

Execute estes comandos **um por vez** no SQL Editor do Supabase:

## 1. Corrigir constraint de role (NOVO - execute primeiro)
```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'operator', 'viewer'));
```

## 2. Adicionar coluna is_super_admin
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
```

## 3. Encontrar seu usuário (execute e copie o ID)
```sql
SELECT id, email FROM auth.users WHERE email = 'ederportelalima@hotmail.com';
```

## 4. Configurar como super admin (substitua o ID)
**IMPORTANTE: Substitua `COLE_SEU_ID_AQUI` pelo ID do passo 3**

```sql
UPDATE profiles 
SET 
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    full_name = 'Eder Portal - Super Admin'
WHERE id = 'COLE_SEU_ID_AQUI';
```

## 5. Se não existir perfil, criar um (substitua o ID)
**IMPORTANTE: Substitua `COLE_SEU_ID_AQUI` pelo ID do passo 3**

```sql
INSERT INTO profiles (id, email, full_name, role, is_active, is_super_admin)
VALUES (
    'COLE_SEU_ID_AQUI',
    'ederportelalima@hotmail.com',
    'Eder Portal - Super Admin',
    'super_admin',
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;
```

## 6. Verificar se funcionou
```sql
SELECT email, full_name, role, is_super_admin FROM profiles WHERE is_super_admin = TRUE;
```

## ✅ Pronto!

Se o passo 6 mostrar seu email com `is_super_admin = true`, a configuração básica está completa.

O sistema já vai reconhecer você como super admin no frontend!

## Opcional: Adicionar aos tenants existentes

Se quiser acesso aos tenants existentes, execute também (substitua o ID):

```sql
INSERT INTO tenant_users (tenant_id, user_id, role, active)
SELECT t.id, 'COLE_SEU_ID_AQUI', 'super_admin', TRUE
FROM tenants t
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'super_admin', active = TRUE;
```