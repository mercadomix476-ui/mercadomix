-- =============================================
-- FIX DIRETO COM ID DO USUÁRIO
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Atualizar diretamente pelo ID que apareceu no erro
UPDATE profiles 
SET 
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW()
WHERE id = 'a43139d8-2cb0-43e3-beaf-2cd9eec09fb2';

-- 2. Se não existir, criar o perfil
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_super_admin, 
    is_active,
    created_at,
    updated_at
) VALUES (
    'a43139d8-2cb0-43e3-beaf-2cd9eec09fb2',
    'ederportelalima@hotmail.com',
    'Eder Portal Lima',
    'admin',
    TRUE,
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW();

-- 3. Verificar se funcionou
SELECT 
    'RESULTADO:' as step,
    id,
    email,
    role,
    is_super_admin,
    is_active,
    CASE 
        WHEN role = 'admin' THEN '✅ SUCESSO - É ADMIN!'
        ELSE '❌ FALHOU - AINDA OPERADOR'
    END as status
FROM profiles 
WHERE id = 'a43139d8-2cb0-43e3-beaf-2cd9eec09fb2';

-- 4. Deletar e recriar se necessário (último recurso)
-- DELETE FROM profiles WHERE id = 'a43139d8-2cb0-43e3-beaf-2cd9eec09fb2';
-- 
-- INSERT INTO profiles (
--     id, 
--     email, 
--     full_name, 
--     role, 
--     is_super_admin, 
--     is_active,
--     created_at,
--     updated_at
-- ) VALUES (
--     'a43139d8-2cb0-43e3-beaf-2cd9eec09fb2',
--     'ederportelalima@hotmail.com',
--     'Eder Portal Lima',
--     'admin',
--     TRUE,
--     TRUE,
--     NOW(),
--     NOW()
-- );