-- DIAGNÓSTICO SUPER ADMIN
-- Execute estas queries uma por vez para verificar o que está acontecendo

-- 1. Verificar se o super admin foi configurado corretamente
SELECT 
    'Super Admin Status' as check_type,
    p.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active
FROM profiles p
WHERE p.email = 'ederportelalima@hotmail.com';

-- 2. Verificar quantos tenants existem
SELECT 
    'Tenants Existentes' as check_type,
    COUNT(*) as total_tenants,
    COUNT(CASE WHEN active = true THEN 1 END) as active_tenants
FROM tenants;

-- 3. Listar todos os tenants
SELECT 
    'Lista de Tenants' as check_type,
    id,
    name,
    active,
    owner_id,
    created_at
FROM tenants
ORDER BY created_at;

-- 4. Verificar se o super admin tem acesso aos tenants
SELECT 
    'Super Admin Tenant Access' as check_type,
    t.name as tenant_name,
    tu.role,
    tu.active,
    tu.created_at
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
JOIN profiles p ON tu.user_id = p.id
WHERE p.email = 'ederportelalima@hotmail.com'
ORDER BY t.name;

-- 5. Verificar quantos produtos existem por tenant
SELECT 
    'Produtos por Tenant' as check_type,
    t.name as tenant_name,
    COUNT(pr.id) as total_produtos
FROM tenants t
LEFT JOIN products pr ON t.id = pr.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 6. Verificar se a função is_super_admin está funcionando
SELECT 
    'Função is_super_admin' as check_type,
    is_super_admin() as is_current_user_super_admin;

-- 7. Testar acesso direto aos produtos (como super admin)
SELECT 
    'Acesso Direto Produtos' as check_type,
    COUNT(*) as total_produtos_visiveis
FROM products;

-- 8. Verificar produtos do primeiro tenant especificamente
SELECT 
    'Produtos Primeiro Tenant' as check_type,
    pr.name,
    pr.tenant_id,
    t.name as tenant_name
FROM products pr
JOIN tenants t ON pr.tenant_id = t.id
ORDER BY t.created_at, pr.name
LIMIT 10;