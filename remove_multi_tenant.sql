-- =============================================
-- REMOVER SISTEMA MULTI-TENANT COMPLETAMENTE
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. DESABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES
DROP POLICY IF EXISTS "tenants_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_update_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_delete_policy" ON tenants;

DROP POLICY IF EXISTS "tenant_users_select_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_insert_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_update_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_delete_policy" ON tenant_users;

DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

DROP POLICY IF EXISTS "sales_select_policy" ON sales;
DROP POLICY IF EXISTS "sales_insert_policy" ON sales;
DROP POLICY IF EXISTS "sales_update_policy" ON sales;
DROP POLICY IF EXISTS "sales_delete_policy" ON sales;

DROP POLICY IF EXISTS "sale_items_select_policy" ON sale_items;
DROP POLICY IF EXISTS "sale_items_insert_policy" ON sale_items;
DROP POLICY IF EXISTS "sale_items_update_policy" ON sale_items;
DROP POLICY IF EXISTS "sale_items_delete_policy" ON sale_items;

DROP POLICY IF EXISTS "stock_movements_select_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_update_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete_policy" ON stock_movements;

DROP POLICY IF EXISTS "store_settings_select_policy" ON store_settings;
DROP POLICY IF EXISTS "store_settings_insert_policy" ON store_settings;
DROP POLICY IF EXISTS "store_settings_update_policy" ON store_settings;
DROP POLICY IF EXISTS "store_settings_delete_policy" ON store_settings;

-- 3. REMOVER FUNÇÕES RELACIONADAS AO MULTI-TENANT
DROP FUNCTION IF EXISTS get_user_tenant_ids(UUID);
DROP FUNCTION IF EXISTS is_super_admin_safe(UUID);
DROP FUNCTION IF EXISTS is_super_admin(UUID);

-- 4. REMOVER COLUNAS tenant_id DAS TABELAS
ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sale_items DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE stock_movements DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE store_settings DROP COLUMN IF EXISTS tenant_id;

-- 5. REMOVER TABELAS DE TENANT
DROP TABLE IF EXISTS tenant_users;
DROP TABLE IF EXISTS tenants;

-- 6. REABILITAR RLS APENAS PARA PROFILES (MANTER SEGURANÇA BÁSICA)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. POLICY SIMPLES PARA PROFILES (USUÁRIOS PODEM VER APENAS SEU PRÓPRIO PERFIL)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 8. CRIAR DADOS INICIAIS SIMPLES
INSERT INTO store_settings (
    store_name,
    store_address,
    store_phone,
    store_email,
    currency,
    tax_rate,
    created_at,
    updated_at
)
SELECT 
    'Minha Loja',
    'Endereço da Loja',
    '(00) 0000-0000',
    (SELECT email FROM auth.users LIMIT 1),
    'BRL',
    0.0,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- 9. CRIAR ALGUNS PRODUTOS DE EXEMPLO
INSERT INTO products (
    name,
    description,
    price,
    cost,
    stock_quantity,
    min_stock,
    barcode,
    category,
    active,
    created_at,
    updated_at
) VALUES 
(
    'Coca-Cola 350ml',
    'Refrigerante Coca-Cola lata 350ml',
    3.50,
    2.00,
    100,
    10,
    '7894900011517',
    'Bebidas',
    TRUE,
    NOW(),
    NOW()
),
(
    'Pão Francês',
    'Pão francês tradicional (unidade)',
    0.50,
    0.25,
    200,
    20,
    '1234567890123',
    'Padaria',
    TRUE,
    NOW(),
    NOW()
),
(
    'Leite Integral 1L',
    'Leite integral UHT 1 litro',
    4.50,
    3.20,
    50,
    5,
    '7891000100103',
    'Laticínios',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 10. VERIFICAR RESULTADO
SELECT 
    'MULTI-TENANT REMOVIDO COM SUCESSO!' as status,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM store_settings) as total_store_settings,
    'Sistema agora é single-tenant' as message;