-- =============================================
-- CORRIGIR PROBLEMAS DE LOGIN MÚLTIPLO
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários ativos
SELECT 
    'USUÁRIOS ATIVOS:' as step,
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    p.role,
    p.is_super_admin,
    p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.last_sign_in_at DESC;

-- 2. Garantir que todos os usuários tenham perfil
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
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    CASE 
        WHEN u.email = 'ederportelalima@hotmail.com' THEN 'admin'
        WHEN u.email = 'mercadomix476@gmail.com' THEN 'admin'
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
        WHEN profiles.email = 'ederportelalima@hotmail.com' THEN 'admin'
        WHEN profiles.email = 'mercadomix476@gmail.com' THEN 'admin'
        ELSE profiles.role
    END,
    is_super_admin = CASE 
        WHEN profiles.email IN ('ederportelalima@hotmail.com', 'mercadomix476@gmail.com') THEN TRUE
        ELSE profiles.is_super_admin
    END,
    is_active = TRUE,
    updated_at = NOW();

-- 3. Verificar resultado
SELECT 
    'PERFIS CORRIGIDOS:' as step,
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN p.role = 'admin' AND p.is_super_admin = TRUE THEN '✅ ADMIN OK'
        WHEN p.role IS NULL THEN '❌ SEM PERFIL'
        ELSE '⚠️ OPERADOR'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.email;

-- 4. Limpar possíveis sessões problemáticas (opcional)
-- DELETE FROM auth.sessions WHERE expires_at < NOW();

-- 5. Verificar configurações de autenticação
SELECT 
    'CONFIGURAÇÃO FINAL:' as step,
    'Perfis sincronizados com usuários' as message;