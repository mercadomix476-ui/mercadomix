-- =============================================
-- CORRIGIR EXIBIÇÃO DA LOGO NO SISTEMA
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela store_settings existe
SELECT 
    'VERIFICANDO TABELA:' as step,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'store_settings'
    ) as tabela_existe;

-- 2. Verificar dados atuais
SELECT 
    'DADOS ATUAIS:' as step,
    COUNT(*) as total_registros
FROM store_settings;

-- 3. Mostrar configurações se existirem
SELECT 
    'CONFIGURAÇÕES EXISTENTES:' as step,
    *
FROM store_settings;

-- 4. Inserir configuração padrão se não existir
INSERT INTO store_settings (
    store_name,
    store_address,
    store_phone,
    store_email,
    currency,
    tax_rate,
    logo_url,
    printer_name,
    printer_width,
    auto_print,
    alert_email,
    enable_stock_alerts,
    alert_threshold,
    created_at,
    updated_at
) VALUES (
    'Minha Loja',
    'Rua Principal, 123',
    '(11) 99999-9999',
    'ederportelalima@hotmail.com',
    'BRL',
    0.0,
    'https://via.placeholder.com/200x200/1B4332/FFFFFF?text=MINHA+LOJA',
    '',
    48,
    TRUE,
    'ederportelalima@hotmail.com',
    TRUE,
    50,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Se já existe mas não tem logo, atualizar
UPDATE store_settings 
SET 
    logo_url = 'https://via.placeholder.com/200x200/1B4332/FFFFFF?text=MINHA+LOJA',
    updated_at = NOW()
WHERE logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%nexuslogo%';

-- 6. Verificar resultado final
SELECT 
    'RESULTADO FINAL:' as step,
    id,
    store_name,
    logo_url,
    'Agora a logo deve aparecer no sistema!' as status
FROM store_settings;

-- 7. Testar URL da logo
SELECT 
    'TESTE ESTA URL:' as info,
    logo_url,
    'Cole no navegador para ver se a logo carrega' as instrucao
FROM store_settings;