-- =============================================
-- FORÇAR ROLE ADMIN PARA ederportelalima@hotmail.com
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário atual
SELECT 
    'ANTES DA CORREÇÃO:' as step,
    u.id,
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';

-- 2. Forçar atualização para admin
UPDATE profiles 
SET 
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'ederportelalima@hotmail.com'
);

-- 3. Se não atualizou nenhuma linha, inserir novo registro
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
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = u.id
);

-- 4. Verificar resultado
SELECT 
    'DEPOIS DA CORREÇÃO:' as step,
    u.id,
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN p.role = 'admin' THEN '✅ ADMIN CONFIGURADO!'
        ELSE '❌ AINDA É OPERADOR'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';

-- 5. Mostrar todos os perfis para debug
SELECT 
    'TODOS OS PERFIS:' as info,
    email,
    role,
    is_super_admin,
    is_active,
    created_at,
    updated_at
FROM profiles
ORDER BY created_at;