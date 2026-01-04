-- =============================================
-- FIX RÁPIDO - TORNAR ederportelalima ADMIN
-- =============================================

-- Atualizar diretamente o perfil para admin
UPDATE profiles 
SET 
    role = 'admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'ederportelalima@hotmail.com'
);

-- Se não existir perfil, criar um
INSERT INTO profiles (id, email, full_name, role, is_super_admin, is_active)
SELECT 
    u.id,
    u.email,
    'Eder Portal Lima',
    'admin',
    TRUE,
    TRUE
FROM auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- Verificar resultado
SELECT 
    u.email,
    p.role,
    p.is_super_admin,
    p.is_active,
    'ADMIN CONFIGURADO!' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'ederportelalima@hotmail.com';