-- =============================================
-- DEBUG - VERIFICAR PROBLEMA DE REDIRECIONAMENTO
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário mercadomix476@gmail.com
SELECT 
    'USUÁRIO MERCADOMIX:' as step,
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.phone_confirmed_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
        ELSE '❌ Email não confirmado'
    END as status_email
FROM auth.users u
WHERE u.email = 'mercadomix476@gmail.com';

-- 2. Verificar perfil do usuário
SELECT 
    'PERFIL MERCADOMIX:' as step,
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active,
    p.created_at,
    p.updated_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'mercadomix476@gmail.com';

-- 3. Verificar se há sessões ativas (versão simplificada)
SELECT 
    'SESSÕES ATIVAS:' as step,
    COUNT(*) as total_sessoes
FROM auth.sessions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'mercadomix476@gmail.com';

-- 4. Forçar confirmação de email se necessário
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    phone_confirmed_at = COALESCE(phone_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'mercadomix476@gmail.com';

-- 5. Garantir que o perfil está correto
UPDATE profiles 
SET 
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'mercadomix476@gmail.com'
);

-- 6. Verificar resultado final
SELECT 
    'RESULTADO FINAL:' as step,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_ok,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL AND p.role = 'admin' AND p.is_super_admin = TRUE THEN '✅ TUDO OK'
        WHEN u.email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO'
        WHEN p.role != 'admin' THEN '❌ NÃO É ADMIN'
        ELSE '⚠️ VERIFICAR'
    END as diagnostico
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'mercadomix476@gmail.com';

-- 7. Verificar estrutura da tabela sessions (para debug)
SELECT 
    'COLUNAS DA TABELA SESSIONS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sessions' AND table_schema = 'auth'
ORDER BY ordinal_position;

SELECT 'SCRIPT CONCLUÍDO - TESTE O LOGIN AGORA' as final_message;