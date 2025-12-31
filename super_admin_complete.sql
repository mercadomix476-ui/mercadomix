-- SCRIPT COMPLETO SUPER ADMIN - Execute tudo de uma vez

-- 1. Corrigir constraint para permitir super_admin
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'operator', 'viewer'));

-- 2. Adicionar coluna is_super_admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 3. Criar função is_super_admin
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

-- 4. Configurar ederportelalima@hotmail.com como super admin
UPDATE profiles 
SET 
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    full_name = 'Eder Portal - Super Admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ederportelalima@hotmail.com'
);

-- 5. Se não existir perfil, criar um
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

-- 6. Atualizar políticas RLS para permitir super admin

-- Políticas para tenants
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

-- Políticas para tenant_users
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

-- Políticas para products
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

-- Políticas para sales
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

-- Políticas para store_settings
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

-- Políticas para stock_movements
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

-- 7. Adicionar super admin aos tenants existentes
INSERT INTO tenant_users (tenant_id, user_id, role, active)
SELECT 
    t.id,
    u.id,
    'super_admin',
    TRUE
FROM tenants t
CROSS JOIN auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
AND t.active = TRUE
ON CONFLICT (tenant_id, user_id) 
DO UPDATE SET 
    role = 'super_admin',
    active = TRUE,
    updated_at = NOW();

-- 8. Verificar resultado
SELECT 
    'SUCCESS: Super admin configurado!' as status,
    p.email, 
    p.full_name, 
    p.role, 
    p.is_super_admin,
    COUNT(tu.tenant_id) as tenants_count
FROM profiles p
LEFT JOIN tenant_users tu ON p.id = tu.user_id
WHERE p.is_super_admin = TRUE
GROUP BY p.id, p.email, p.full_name, p.role, p.is_super_admin;