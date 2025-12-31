-- =============================================
-- CONFIGURAÇÃO DE SUPER USUÁRIO - VERSÃO SIMPLES
-- =============================================
-- Execute este script em partes se houver problemas com o script completo

-- PARTE 1: Adicionar coluna para super admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- PARTE 2: Criar função para verificar super admin
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

-- PARTE 3: Configurar ederportelalima@hotmail.com como super admin
-- Primeiro, encontre o ID do usuário executando esta query:
-- SELECT id, email FROM auth.users WHERE email = 'ederportelalima@hotmail.com';

-- Depois, substitua 'USER_ID_AQUI' pelo ID real e execute:
/*
INSERT INTO profiles (id, email, full_name, role, is_active, is_super_admin)
VALUES (
    'USER_ID_AQUI',  -- Substitua pelo ID real do usuário
    'ederportelalima@hotmail.com',
    'Eder Portal - Super Admin',
    'super_admin',
    TRUE,
    TRUE
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'super_admin',
    is_active = TRUE,
    is_super_admin = TRUE,
    updated_at = NOW();
*/

-- PARTE 4: Atualizar políticas RLS para tenants
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        is_super_admin() OR
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Tenant owners can update their tenants" ON tenants;
CREATE POLICY "Tenant owners can update their tenants" ON tenants
    FOR UPDATE USING (
        is_super_admin() OR
        auth.uid() = owner_id
    );

-- PARTE 5: Atualizar políticas para tenant_users
DROP POLICY IF EXISTS "Users can view their tenant relationships" ON tenant_users;
CREATE POLICY "Users can view their tenant relationships" ON tenant_users
    FOR SELECT USING (
        is_super_admin() OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Tenant owners can manage tenant users" ON tenant_users;
CREATE POLICY "Tenant owners can manage tenant users" ON tenant_users
    FOR ALL USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

-- PARTE 6: Atualizar políticas para products
DROP POLICY IF EXISTS "Users can view products from their tenants" ON products;
CREATE POLICY "Users can view products from their tenants" ON products
    FOR SELECT USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage products in their tenants" ON products;
CREATE POLICY "Users can manage products in their tenants" ON products
    FOR ALL USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- PARTE 7: Atualizar políticas para sales
DROP POLICY IF EXISTS "Users can view sales from their tenants" ON sales;
CREATE POLICY "Users can view sales from their tenants" ON sales
    FOR SELECT USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage sales in their tenants" ON sales;
CREATE POLICY "Users can manage sales in their tenants" ON sales
    FOR ALL USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- PARTE 8: Atualizar políticas para stock_movements
DROP POLICY IF EXISTS "Users can view stock movements from their tenants" ON stock_movements;
CREATE POLICY "Users can view stock movements from their tenants" ON stock_movements
    FOR SELECT USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage stock movements in their tenants" ON stock_movements;
CREATE POLICY "Users can manage stock movements in their tenants" ON stock_movements
    FOR ALL USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- PARTE 9: Atualizar políticas para store_settings
DROP POLICY IF EXISTS "Users can view store settings from their tenants" ON store_settings;
CREATE POLICY "Users can view store settings from their tenants" ON store_settings
    FOR SELECT USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage store settings in their tenants" ON store_settings;
CREATE POLICY "Users can manage store settings in their tenants" ON store_settings
    FOR ALL USING (
        is_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- PARTE 10: Verificar configuração
SELECT 
    'Configuração concluída!' as status,
    COUNT(*) as super_admins_count
FROM profiles 
WHERE is_super_admin = TRUE;