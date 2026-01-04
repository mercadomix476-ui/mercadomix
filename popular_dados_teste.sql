-- POPULAR BANCO COM DADOS DE TESTE
-- Execute este script para criar dados de exemplo

-- 1. Criar tenant de teste se não existir
INSERT INTO tenants (id, name, active, owner_id)
SELECT 
    'tenant-1',
    'Mercadinho Central',
    TRUE,
    u.id
FROM auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
ON CONFLICT (id) DO NOTHING;

-- 2. Adicionar super admin ao tenant
INSERT INTO tenant_users (tenant_id, user_id, role, active)
SELECT 
    'tenant-1',
    u.id,
    'super_admin',
    TRUE
FROM auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
ON CONFLICT (tenant_id, user_id) 
DO UPDATE SET 
    role = 'super_admin',
    active = TRUE;

-- 3. Criar alguns produtos de exemplo
INSERT INTO products (name, barcode, sku, category, unit_type, cost_price, sale_price, stock_quantity, min_stock, tenant_id)
VALUES 
    ('Coca-Cola 350ml', '7894900011517', 'COCA350', 'Bebidas', 'unidade', 2.50, 4.00, 50, 10, 'tenant-1'),
    ('Pão de Açúcar 500g', '7891000100103', 'PAO500', 'Padaria', 'unidade', 3.20, 5.50, 30, 5, 'tenant-1'),
    ('Leite Integral 1L', '7891000053508', 'LEITE1L', 'Laticínios', 'unidade', 3.80, 6.20, 25, 8, 'tenant-1'),
    ('Arroz Branco 5kg', '7896036098400', 'ARROZ5KG', 'Grãos', 'unidade', 18.50, 28.90, 15, 3, 'tenant-1'),
    ('Feijão Preto 1kg', '7896036098417', 'FEIJAO1KG', 'Grãos', 'unidade', 6.80, 11.50, 20, 5, 'tenant-1'),
    ('Açúcar Cristal 1kg', '7896036098424', 'ACUCAR1KG', 'Açúcar', 'unidade', 3.20, 5.80, 40, 8, 'tenant-1'),
    ('Óleo de Soja 900ml', '7896036098431', 'OLEO900ML', 'Óleos', 'unidade', 4.50, 7.90, 35, 7, 'tenant-1'),
    ('Macarrão Espaguete 500g', '7896036098448', 'MAC500G', 'Massas', 'unidade', 2.80, 4.90, 60, 12, 'tenant-1'),
    ('Sabão em Pó 1kg', '7896036098455', 'SABAO1KG', 'Limpeza', 'unidade', 8.90, 14.50, 18, 4, 'tenant-1'),
    ('Papel Higiênico 4 rolos', '7896036098462', 'PAPEL4R', 'Higiene', 'unidade', 6.20, 10.80, 22, 6, 'tenant-1')
ON CONFLICT (barcode, tenant_id) DO NOTHING;

-- 4. Criar configurações da loja
INSERT INTO store_settings (store_name, cnpj, address, phone, tenant_id, auto_print, enable_stock_alerts)
VALUES ('Mercadinho Central', '12.345.678/0001-90', 'Rua das Flores, 123 - Centro', '(11) 99999-9999', 'tenant-1', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- 5. Verificar se os dados foram criados
SELECT 
    'Dados Criados com Sucesso!' as status,
    (SELECT COUNT(*) FROM tenants WHERE id = 'tenant-1') as tenants,
    (SELECT COUNT(*) FROM products WHERE tenant_id = 'tenant-1') as produtos,
    (SELECT COUNT(*) FROM store_settings WHERE tenant_id = 'tenant-1') as configuracoes,
    (SELECT COUNT(*) FROM tenant_users WHERE tenant_id = 'tenant-1') as usuarios;