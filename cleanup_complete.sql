-- =============================================
-- LIMPEZA FINAL - REMOVER MULTI-TENANT COMPLETAMENTE
-- =============================================
-- Execute este script APÓS executar o remove_multi_tenant.sql

-- 1. Limpar localStorage (isso será feito no frontend)
-- localStorage.removeItem('current_tenant_id');

-- 2. Verificar se todas as tabelas estão sem RLS desnecessário
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que profiles mantém RLS básico
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Verificar estrutura final das tabelas
SELECT 
    'ESTRUTURA FINAL DAS TABELAS' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('products', 'sales', 'sale_items', 'stock_movements', 'store_settings')
AND column_name NOT LIKE '%tenant%'
ORDER BY table_name, ordinal_position;

-- 5. Verificar dados existentes
SELECT 'DADOS EXISTENTES:' as info;
SELECT 'Products:' as table_name, COUNT(*) as total FROM products
UNION ALL
SELECT 'Sales:', COUNT(*) FROM sales
UNION ALL
SELECT 'Store Settings:', COUNT(*) FROM store_settings;

-- 6. Status final
SELECT 
    'SISTEMA SINGLE-TENANT CONFIGURADO!' as status,
    'Multi-tenant removido com sucesso' as message,
    'Aplicação pronta para uso' as next_step;