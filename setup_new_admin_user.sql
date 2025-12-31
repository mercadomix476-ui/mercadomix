-- =============================================
-- CONFIGURAR NOVO USUÁRIO ADMIN - mercadomix476@gmail.com
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário já existe
SELECT 
    'VERIFICANDO USUÁRIO EXISTENTE:' as step,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'mercadomix476@gmail.com';

-- 2. Verificar perfil existente
SELECT 
    'PERFIL EXISTENTE:' as step,
    p.id,
    p.email,
    p.role,
    p.is_super_admin,
    p.is_active
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'mercadomix476@gmail.com';

-- 3. Criar/Atualizar perfil como admin (se o usuário existir)
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
    'Mercado Mix Admin',
    'admin',
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'mercadomix476@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW(),
    full_name = COALESCE(profiles.full_name, 'Mercado Mix Admin');

-- 4. Verificar resultado
SELECT 
    'RESULTADO:' as step,
    u.id,
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN p.role = 'admin' AND p.is_super_admin = TRUE THEN '✅ ADMIN CONFIGURADO!'
        WHEN u.id IS NULL THEN '❌ USUÁRIO NÃO EXISTE - PRECISA CRIAR CONTA'
        ELSE '⚠️ VERIFICAR CONFIGURAÇÃO'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'mercadomix476@gmail.com';

-- 5. Mostrar todos os usuários admin para verificar
SELECT 
    'USUÁRIOS ADMIN:' as info,
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin' OR p.is_super_admin = TRUE
ORDER BY u.created_at;