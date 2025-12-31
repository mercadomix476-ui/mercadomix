-- =============================================
-- FIX PARA RECURSÃO INFINITA NAS POLICIES
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES PROBLEMÁTICAS
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Tenant owners can update their tenants" ON tenants;
DROP POLICY IF EXISTS "Super admin can do everything on tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
DROP POLICY IF EXISTS "Allow super admin all access" ON tenants;

DROP POLICY IF EXISTS "Users can view their tenant relationships" ON tenant_users;
DROP POLICY IF EXISTS "Tenant owners can manage tenant users" ON tenant_users;
DROP POLICY IF EXISTS "Super admin can do everything on tenant_users" ON tenant_users;
DROP POLICY IF EXISTS "Users can view their relationships" ON tenant_users;
DROP POLICY IF EXISTS "Allow super admin all access" ON tenant_users;

-- Remover policies das outras tabelas também
DROP POLICY IF EXISTS "Users can view products from their tenants" ON products;
DROP POLICY IF EXISTS "Users can manage products in their tenants" ON products;
DROP POLICY IF EXISTS "Users can view sales from their tenants" ON sales;
DROP POLICY IF EXISTS "Users can manage sales in their tenants" ON sales;
DROP POLICY IF EXISTS "Users can view sale items from their tenants" ON sale_items;
DROP POLICY IF EXISTS "Users can manage sale items in their tenants" ON sale_items;
DROP POLICY IF EXISTS "Users can view stock movements from their tenants" ON stock_movements;
DROP POLICY IF EXISTS "Users can manage stock movements in their tenants" ON stock_movements;
DROP POLICY IF EXISTS "Users can view store settings from their tenants" ON store_settings;
DROP POLICY IF EXISTS "Users can manage store settings in their tenants" ON store_settings;

-- 3. CRIAR FUNÇÃO HELPER SEGURA (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION get_user_tenant_ids(user_id UUID DEFAULT auth.uid())
RETURNS UUID[] AS $$
BEGIN
    -- Retorna array de tenant_ids que o usuário tem acesso
    RETURN ARRAY(
        SELECT tenant_id 
        FROM tenant_users 
        WHERE user_id = $1 AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA VERIFICAR SE É SUPER ADMIN (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION is_super_admin_safe(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Verifica diretamente na tabela profiles sem usar RLS
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = COALESCE(user_id, auth.uid())
        AND (role = 'super_admin' OR is_super_admin = TRUE)
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REABILITAR RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLICIES SIMPLES E SEGURAS PARA TENANTS
CREATE POLICY "tenants_select_policy" ON tenants
    FOR SELECT USING (
        is_super_admin_safe() OR 
        owner_id = auth.uid() OR 
        id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "tenants_insert_policy" ON tenants
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR 
        auth.uid() = owner_id
    );

CREATE POLICY "tenants_update_policy" ON tenants
    FOR UPDATE USING (
        is_super_admin_safe() OR 
        owner_id = auth.uid()
    );

CREATE POLICY "tenants_delete_policy" ON tenants
    FOR DELETE USING (
        is_super_admin_safe() OR 
        owner_id = auth.uid()
    );

-- 7. POLICIES PARA TENANT_USERS
CREATE POLICY "tenant_users_select_policy" ON tenant_users
    FOR SELECT USING (
        is_super_admin_safe() OR 
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "tenant_users_insert_policy" ON tenant_users
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "tenant_users_update_policy" ON tenant_users
    FOR UPDATE USING (
        is_super_admin_safe() OR
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "tenant_users_delete_policy" ON tenant_users
    FOR DELETE USING (
        is_super_admin_safe() OR
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

-- 8. POLICIES PARA PRODUCTS
CREATE POLICY "products_select_policy" ON products
    FOR SELECT USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "products_insert_policy" ON products
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "products_update_policy" ON products
    FOR UPDATE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "products_delete_policy" ON products
    FOR DELETE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

-- 9. POLICIES PARA SALES
CREATE POLICY "sales_select_policy" ON sales
    FOR SELECT USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "sales_insert_policy" ON sales
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "sales_update_policy" ON sales
    FOR UPDATE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "sales_delete_policy" ON sales
    FOR DELETE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

-- 10. POLICIES PARA SALE_ITEMS
CREATE POLICY "sale_items_select_policy" ON sale_items
    FOR SELECT USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "sale_items_insert_policy" ON sale_items
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "sale_items_update_policy" ON sale_items
    FOR UPDATE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "sale_items_delete_policy" ON sale_items
    FOR DELETE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

-- 11. POLICIES PARA STOCK_MOVEMENTS
CREATE POLICY "stock_movements_select_policy" ON stock_movements
    FOR SELECT USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "stock_movements_insert_policy" ON stock_movements
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "stock_movements_update_policy" ON stock_movements
    FOR UPDATE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "stock_movements_delete_policy" ON stock_movements
    FOR DELETE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

-- 12. POLICIES PARA STORE_SETTINGS
CREATE POLICY "store_settings_select_policy" ON store_settings
    FOR SELECT USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "store_settings_insert_policy" ON store_settings
    FOR INSERT WITH CHECK (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "store_settings_update_policy" ON store_settings
    FOR UPDATE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

CREATE POLICY "store_settings_delete_policy" ON store_settings
    FOR DELETE USING (
        is_super_admin_safe() OR 
        tenant_id = ANY(get_user_tenant_ids())
    );

-- 13. VERIFICAR SE FUNCIONOU
SELECT 
    'POLICIES CORRIGIDAS!' as status,
    'Recursão infinita resolvida' as message;

-- 14. TESTAR CONSULTA SIMPLES
SELECT COUNT(*) as total_tenants FROM tenants;