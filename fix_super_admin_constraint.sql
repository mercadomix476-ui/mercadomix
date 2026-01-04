-- CORREÇÃO: Adicionar 'super_admin' à constraint de role
-- Execute este comando primeiro para permitir o role 'super_admin'

-- 1. Remover a constraint atual
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Adicionar nova constraint incluindo 'super_admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'operator', 'viewer'));