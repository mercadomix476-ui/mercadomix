-- =============================================
-- CONFIGURAR DADOS INICIAIS APÓS CORREÇÃO DAS POLICIES
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR USUÁRIO ATUAL
SELECT 
    'Verificando usuário atual...' as status,
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email;

-- 2. VERIFICAR SE PERFIL EXISTE
SELECT 
    'Verificando perfil...' as status,
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) as profile_exists;

-- 3. CRIAR/ATUALIZAR PERFIL DO USUÁRIO ATUAL
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
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    'super_admin',
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.id = auth.uid()
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE,
    updated_at = NOW();

-- 4. VERIFICAR SE TENANT 'tenant-1' EXISTE
SELECT 
    'Verificando tenant tenant-1...' as status,
    EXISTS(SELECT 1 FROM tenants WHERE id = 'tenant-1') as tenant_exists;

-- 5. CRIAR TENANT 'tenant-1' SE NÃO EXISTIR
INSERT INTO tenants (
    id,
    name,
    description,
    owner_id,
    active,
    created_at,
    updated_at
)
SELECT 
    'tenant-1'::uuid,
    'Mercadinho Central',
    'Loja principal do sistema',
    auth.uid(),
    TRUE,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE id = 'tenant-1');

-- 6. ADICIONAR USUÁRIO ATUAL AO TENANT
INSERT INTO tenant_users (
    tenant_id,
    user_id,
    role,
    permissions,
    active,
    created_at,
    updated_at
)
SELECT 
    'tenant-1'::uuid,
    auth.uid(),
    'super_admin',
    '["all"]'::jsonb,
    TRUE,
    NOW(),
    NOW()
ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    role = 'super_admin',
    permissions = '["all"]'::jsonb,
    active = TRUE,
    updated_at = NOW();

-- 7. VERIFICAR SE AS COLUNAS tenant_id EXISTEM NAS TABELAS
SELECT 
    'Verificando colunas tenant_id...' as status,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'tenant_id'
    ) as products_has_tenant_id,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'tenant_id'
    ) as sales_has_tenant_id,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' AND column_name = 'tenant_id'
    ) as store_settings_has_tenant_id;

-- 8. ADICIONAR COLUNAS tenant_id SE NÃO EXISTIREM
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 9. CRIAR CONFIGURAÇÕES INICIAIS DA LOJA
INSERT INTO store_settings (
    tenant_id,
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
    'tenant-1'::uuid,
    'Mercadinho Central',
    'Rua Principal, 123 - Centro',
    '(11) 99999-9999',
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'BRL',
    0.0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM store_settings WHERE tenant_id = 'tenant-1'
);

-- 10. CRIAR ALGUNS PRODUTOS DE EXEMPLO
INSERT INTO products (
    tenant_id,
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
    'tenant-1'::uuid,
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
    'tenant-1'::uuid,
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
    'tenant-1'::uuid,
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

-- 11. VERIFICAR RESULTADO FINAL
SELECT 
    'CONFIGURAÇÃO CONCLUÍDA!' as status,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM tenant_users) as total_tenant_users,
    (SELECT COUNT(*) FROM products WHERE tenant_id = 'tenant-1') as products_tenant_1,
    (SELECT COUNT(*) FROM store_settings WHERE tenant_id = 'tenant-1') as store_settings_tenant_1,
    (SELECT COUNT(*) FROM profiles WHERE is_super_admin = TRUE) as super_admins;

-- 12. MOSTRAR DADOS CRIADOS
SELECT 'TENANTS CRIADOS:' as info;
SELECT id, name, owner_id, active FROM tenants;

SELECT 'USUÁRIOS DO TENANT:' as info;
SELECT tu.tenant_id, tu.user_id, tu.role, p.email 
FROM tenant_users tu 
JOIN profiles p ON tu.user_id = p.id;

SELECT 'PRODUTOS CRIADOS:' as info;
SELECT name, price, stock_quantity, category FROM products WHERE tenant_id = 'tenant-1' LIMIT 5;