-- CONFIGURAÇÃO SUPER ADMIN - VERSÃO MÍNIMA
-- Execute este script completo de uma vez no Supabase SQL Editor

-- 1. Adicionar coluna is_super_admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Criar função is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_super_admin = TRUE 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar políticas principais (apenas as essenciais)
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        is_super_admin() OR
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can view their tenant relationships" ON tenant_users;
CREATE POLICY "Users can view their tenant relationships" ON tenant_users
    FOR SELECT USING (
        is_super_admin() OR
        user_id = auth.uid()
    );