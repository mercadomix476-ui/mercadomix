-- =============================================
-- CONFIGURAR SETTINGS INICIAIS DA LOJA
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se já existem configurações
SELECT 
    'CONFIGURAÇÕES ATUAIS:' as step,
    id,
    store_name,
    logo_url,
    created_at
FROM store_settings;

-- 2. Criar configurações iniciais se não existirem
INSERT INTO store_settings (
    store_name,
    store_address,
    store_phone,
    store_email,
    currency,
    tax_rate,
    logo_url,
    created_at,
    updated_at
) 
SELECT 
    'Nexus Commerce',
    'Endereço da sua loja',
    '(00) 0000-0000',
    'ederportelalima@hotmail.com',
    'BRL',
    0.0,
    'https://via.placeholder.com/150/1B4332/FFFFFF?text=LOGO',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- 3. Se já existir, atualizar para garantir que tem logo_url
UPDATE store_settings 
SET 
    logo_url = COALESCE(logo_url, 'https://via.placeholder.com/150/1B4332/FFFFFF?text=LOGO'),
    store_name = COALESCE(store_name, 'Nexus Commerce'),
    updated_at = NOW()
WHERE logo_url IS NULL OR logo_url = '';

-- 4. Verificar resultado
SELECT 
    'CONFIGURAÇÕES FINAIS:' as step,
    id,
    store_name,
    logo_url,
    store_address,
    store_phone,
    currency
FROM store_settings;

-- 5. Mostrar URL da logo para testar
SELECT 
    'TESTE A LOGO:' as info,
    logo_url as url_da_logo,
    'Cole esta URL no navegador para testar' as instrucao
FROM store_settings;