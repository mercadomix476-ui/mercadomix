-- =============================================
-- FIX SIMPLES PARA PROBLEMA DE LOGIN
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário
SELECT 
    'USUÁRIO:' as step,
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmado
FROM auth.users u
WHERE u.email = 'mercadomix476@gmail.com';

-- 2. Confirmar email do usuário
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'mercadomix476@gmail.com';

-- 3. Verificar/criar perfil
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
    updated_at = NOW();

-- 4. Verificar resultado
SELECT 
    'RESULTADO:' as step,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_ok,
    p.role,
    p.is_super_admin,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL AND p.role = 'admin' THEN '✅ PRONTO PARA LOGIN'
        ELSE '❌ AINDA HÁ PROBLEMAS'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'mercadomix476@gmail.com';

SELECT 'AGORA TESTE O LOGIN NA APLICAÇÃO' as instrucao;