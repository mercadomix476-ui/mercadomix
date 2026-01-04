-- =============================================
-- CORRIGIR USUÁRIO ADMIN - ederportelalima@hotmail.com
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário atual
SELECT 
    'VERIFICANDO USUÁRIO' as step,
    u.id,
    u.email,
    u.created_at,
    p.role,
    p.is_super_admin,
    p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';

-- 2. Criar/Atualizar perfil como admin
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
    COALESCE(u.raw_user_meta_data->>'full_name', 'Eder Portal Lima'),
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

-- 3. Verificar se a correção funcionou
SELECT 
    'RESULTADO FINAL' as step,
    u.id,
    u.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active,
    CASE 
        WHEN p.role = 'admin' AND p.is_super_admin = TRUE THEN 'SUCESSO - Usuário é admin!'
        ELSE 'ERRO - Verificar configuração'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';

-- 4. Criar função para manter usuário sempre como admin
CREATE OR REPLACE FUNCTION ensure_admin_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for o usuário ederportelalima@hotmail.com, sempre manter como admin
    IF NEW.email = 'ederportelalima@hotmail.com' THEN
        NEW.role = 'admin';
        NEW.is_super_admin = TRUE;
        NEW.is_active = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para garantir que o usuário sempre seja admin
DROP TRIGGER IF EXISTS ensure_admin_user_trigger ON profiles;
CREATE TRIGGER ensure_admin_user_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_admin_user();

-- 6. Teste final
SELECT 
    'CONFIGURAÇÃO COMPLETA!' as status,
    'Usuário ederportelalima@hotmail.com sempre será admin' as message;