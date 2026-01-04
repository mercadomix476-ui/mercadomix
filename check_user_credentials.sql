-- =============================================
-- VERIFICAR E CORRIGIR CREDENCIAIS DE USUÁRIO
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários existentes
SELECT 
    'USUÁRIOS EXISTENTES:' as step,
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '❌ Não confirmado'
    END as status_email
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar perfis
SELECT 
    'PERFIS EXISTENTES:' as step,
    p.id,
    p.email,
    p.role,
    p.is_super_admin,
    p.is_active,
    u.email as auth_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 3. Confirmar email dos usuários admin (se necessário)
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    phone_confirmed_at = COALESCE(phone_confirmed_at, NOW())
WHERE email IN ('ederportelalima@hotmail.com', 'mercadomix476@gmail.com');

-- 4. Garantir que perfis existem para todos os usuários
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
    CASE 
        WHEN u.email = 'ederportelalima@hotmail.com' THEN 'Eder Portal Lima'
        WHEN u.email = 'mercadomix476@gmail.com' THEN 'Mercado Mix Admin'
        ELSE COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
    END,
    CASE 
        WHEN u.email IN ('ederportelalima@hotmail.com', 'mercadomix476@gmail.com') THEN 'admin'
        ELSE 'operator'
    END,
    CASE 
        WHEN u.email IN ('ederportelalima@hotmail.com', 'mercadomix476@gmail.com') THEN TRUE
        ELSE FALSE
    END,
    TRUE,
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id)
ON CONFLICT (id) DO UPDATE SET
    role = CASE 
        WHEN profiles.email IN ('ederportelalima@hotmail.com', 'mercadomix476@gmail.com') THEN 'admin'
        ELSE profiles.role
    END,
    is_super_admin = CASE 
        WHEN profiles.email IN ('ederportelalima@hotmail.com', 'mercadomix476@gmail.com') THEN TRUE
        ELSE profiles.is_super_admin
    END,
    is_active = TRUE,
    updated_at = NOW();

-- 5. Verificar resultado final
SELECT 
    'RESULTADO FINAL:' as step,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN p.role = 'admin' AND p.is_super_admin = TRUE THEN '✅ ADMIN OK'
        WHEN p.id IS NULL THEN '❌ SEM PERFIL'
        ELSE '⚠️ OPERADOR'
    END as status_final
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.email;

-- 6. Mostrar instruções
SELECT 
    'INSTRUÇÕES:' as info,
    'Se o usuário não existir, crie-o via Supabase Dashboard > Authentication > Users' as instrucao1,
    'Email: mercadomix476@gmail.com' as email_novo,
    'Senha: f350618f-1ab8-4955-9219-b69ad4c7e7ad' as senha_nova,
    'Marque "Auto Confirm User" ao criar' as importante;