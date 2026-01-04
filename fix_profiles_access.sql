-- =============================================
-- CORRIGIR ACESSO À TABELA PROFILES (ERRO 406)
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela profiles existe e tem RLS
SELECT 
    'VERIFICANDO TABELA PROFILES' as step,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Verificar policies existentes
SELECT 
    'POLICIES ATUAIS' as step,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Desabilitar RLS temporariamente para corrigir
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se o usuário existe na tabela auth.users
SELECT 
    'USUÁRIO NA AUTH.USERS' as step,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'ederportelalima@hotmail.com';

-- 5. Verificar se existe perfil
SELECT 
    'PERFIL EXISTENTE' as step,
    id,
    email,
    role,
    is_super_admin,
    is_active
FROM profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ederportelalima@hotmail.com'
);

-- 6. Criar/Atualizar perfil sem RLS
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
    updated_at = NOW(),
    full_name = COALESCE(profiles.full_name, 'Eder Portal Lima');

-- 7. Reabilitar RLS com policies corretas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. Remover policies antigas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 9. Criar policies simples e funcionais
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'admin' OR p.is_super_admin = TRUE)
        )
    );

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'admin' OR p.is_super_admin = TRUE)
        )
    );

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 10. Verificar resultado final
SELECT 
    'RESULTADO FINAL' as step,
    u.id,
    u.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN p.role = 'admin' AND p.is_super_admin = TRUE THEN 'SUCESSO - Admin configurado!'
        ELSE 'VERIFICAR - Pode precisar de ajuste'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';

-- 11. Testar acesso
SELECT 
    'TESTE DE ACESSO' as step,
    'Se você conseguir ver esta linha, o acesso está funcionando!' as message;