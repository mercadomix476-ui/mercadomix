-- SCRIPT FINAL SUPER ADMIN - Execute tudo de uma vez

-- 1. Corrigir constraint para permitir super_admin
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'operator', 'viewer'));

-- 2. Adicionar coluna is_super_admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 3. Configurar ederportelalima@hotmail.com como super admin
UPDATE profiles 
SET 
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    full_name = 'Eder Portal - Super Admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ederportelalima@hotmail.com'
);

-- 4. Se não existir perfil, criar um
INSERT INTO profiles (id, email, full_name, role, is_active, is_super_admin)
SELECT 
    u.id,
    u.email,
    'Eder Portal - Super Admin',
    'super_admin',
    TRUE,
    TRUE
FROM auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- 5. Verificar resultado
SELECT 
    'SUCCESS: Super admin configurado!' as status,
    email, 
    full_name, 
    role, 
    is_super_admin 
FROM profiles 
WHERE is_super_admin = TRUE;