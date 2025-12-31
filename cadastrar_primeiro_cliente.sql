-- CADASTRAR PRIMEIRO CLIENTE
-- Substitua os dados pelos dados reais do cliente

-- 1. Primeiro, o cliente precisa se registrar no sistema
-- Isso deve ser feito via interface de registro ou você pode criar manualmente:

-- EXEMPLO: Criar usuário manualmente (substitua pelos dados reais)
-- NOTA: Normalmente o cliente se registra pela interface, mas você pode criar assim:

/*
-- Inserir na tabela auth.users (apenas se necessário - normalmente feito via Supabase Auth)
-- Este passo geralmente é feito pelo próprio cliente via interface de registro
*/

-- 2. Criar o tenant (empresa) para o cliente
-- SUBSTITUA OS DADOS ABAIXO PELOS DADOS REAIS DO CLIENTE:

INSERT INTO tenants (
    id,
    name,
    cnpj,
    address,
    phone,
    email,
    active,
    owner_id,
    created_at
) VALUES (
    gen_random_uuid(),  -- ID único será gerado automaticamente
    'Padaria do João',  -- SUBSTITUA: Nome da empresa do cliente
    '12.345.678/0001-99',  -- SUBSTITUA: CNPJ do cliente
    'Rua das Padarias, 456 - Bairro Novo',  -- SUBSTITUA: Endereço
    '(11) 98765-4321',  -- SUBSTITUA: Telefone
    'joao@padaria.com',  -- SUBSTITUA: Email do cliente
    TRUE,
    (SELECT id FROM auth.users WHERE email = 'joao@padaria.com'),  -- SUBSTITUA: Email do cliente
    NOW()
);

-- 3. Adicionar o cliente como admin da própria empresa
INSERT INTO tenant_users (
    tenant_id,
    user_id,
    role,
    active,
    created_at
) 
SELECT 
    t.id,
    u.id,
    'admin',
    TRUE,
    NOW()
FROM tenants t
CROSS JOIN auth.users u
WHERE t.email = 'joao@padaria.com'  -- SUBSTITUA: Email do cliente
AND u.email = 'joao@padaria.com'    -- SUBSTITUA: Email do cliente
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 4. Adicionar o super admin ao novo tenant (para suporte)
INSERT INTO tenant_users (
    tenant_id,
    user_id,
    role,
    active,
    created_at
)
SELECT 
    t.id,
    u.id,
    'super_admin',
    TRUE,
    NOW()
FROM tenants t
CROSS JOIN auth.users u
WHERE t.email = 'joao@padaria.com'  -- SUBSTITUA: Email do cliente
AND u.email = 'ederportelalima@hotmail.com'  -- Super admin
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 5. Criar configurações iniciais da loja do cliente
INSERT INTO store_settings (
    store_name,
    cnpj,
    address,
    phone,
    tenant_id,
    auto_print,
    enable_stock_alerts,
    currency,
    created_at
)
SELECT 
    'Padaria do João',  -- SUBSTITUA: Nome da loja
    '12.345.678/0001-99',  -- SUBSTITUA: CNPJ
    'Rua das Padarias, 456 - Bairro Novo',  -- SUBSTITUA: Endereço
    '(11) 98765-4321',  -- SUBSTITUA: Telefone
    t.id,
    TRUE,
    TRUE,
    'BRL',
    NOW()
FROM tenants t
WHERE t.email = 'joao@padaria.com'  -- SUBSTITUA: Email do cliente
ON CONFLICT DO NOTHING;

-- 6. Verificar se tudo foi criado corretamente
SELECT 
    'Cliente Cadastrado com Sucesso!' as status,
    t.name as empresa,
    t.email as email_cliente,
    COUNT(tu.id) as usuarios_no_tenant,
    COUNT(ss.id) as configuracoes
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
LEFT JOIN store_settings ss ON t.id = ss.tenant_id
WHERE t.email = 'joao@padaria.com'  -- SUBSTITUA: Email do cliente
GROUP BY t.id, t.name, t.email;