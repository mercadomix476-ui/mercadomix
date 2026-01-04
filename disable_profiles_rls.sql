-- =============================================
-- DESABILITAR RLS DA TABELA PROFILES (FIX DEFINITIVO)
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Desabilitar RLS completamente da tabela profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as policies da tabela profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3. Criar/Atualizar seu perfil como admin
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_super_admin, 
    is_active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    'Eder Portal Lima',
    'admin',
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW();

-- 4. Verificar se funcionou
SELECT 
    'PERFIL CONFIGURADO!' as status,
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';

-- 5. Mostrar todos os perfis para verificar
SELECT 
    'TODOS OS PERFIS:' as info,
    email,
    role,
    is_super_admin,
    is_active
FROM profiles;