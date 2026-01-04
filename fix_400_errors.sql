-- =============================================
-- FIX RÁPIDO PARA ERROS 400 (Bad Request)
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário atual
SELECT 
    'Usuário atual:' as info,
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- 2. Garantir que o perfil existe
INSERT INTO profiles (id, email, full_name, role, is_super_admin, is_active)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    'super_admin',
    TRUE,
    TRUE
FROM auth.users u
WHERE u.id = auth.uid()
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE;

-- 3. Criar tenant 'tenant-1' (que a aplicação está procurando)
INSERT INTO tenants (id, name, owner_id, active)
VALUES ('tenant-1'::uuid, 'Mercadinho Central', auth.uid(), TRUE)
ON CONFLICT (id) DO UPDATE SET
    owner_id = auth.uid(),
    active = TRUE;

-- 4. Adicionar usuário ao tenant
INSERT INTO tenant_users (tenant_id, user_id, role, active)
VALUES ('tenant-1'::uuid, auth.uid(), 'super_admin', TRUE)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    role = 'super_admin',
    active = TRUE;

-- 5. Garantir que as colunas tenant_id existem
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 6. Criar configuração da loja para tenant-1
INSERT INTO store_settings (tenant_id, store_name, currency, tax_rate)
VALUES ('tenant-1'::uuid, 'Mercadinho Central', 'BRL', 0.0)
ON CONFLICT DO NOTHING;

-- 7. Verificar se funcionou
SELECT 
    'SUCESSO!' as status,
    'Tenant tenant-1 criado e configurado' as message;

-- 8. Testar consultas
SELECT 'Testando consulta de tenants:' as test;
SELECT id, name FROM tenants WHERE id = 'tenant-1';

SELECT 'Testando consulta de store_settings:' as test;
SELECT * FROM store_settings WHERE tenant_id = 'tenant-1';

SELECT 'Testando consulta de products:' as test;
SELECT COUNT(*) as total_products FROM products WHERE tenant_id = 'tenant-1';