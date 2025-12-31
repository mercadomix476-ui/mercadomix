-- =============================================
-- DIAGNÓSTICO COMPLETO PARA CRIAÇÃO DE EMPRESAS
-- =============================================

-- 1. Informações do usuário atual
SELECT 
    '=== USUÁRIO ATUAL ===' as info,
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- 2. Verificar perfil
SELECT 
    '=== PERFIL DO USUÁRIO ===' as info,
    p.*
FROM profiles p 
WHERE p.id = auth.uid();

-- 3. Verificar se pode criar tenants (testar policy)
SELECT 
    '=== TESTE DE POLICY PARA TENANTS ===' as info,
    is_super_admin_safe() as can_create_as_super_admin,
    auth.uid() as current_user_for_owner_check;

-- 4. Listar todas as policies de tenants
SELECT 
    '=== POLICIES DA TABELA TENANTS ===' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tenants'
ORDER BY cmd, policyname;

-- 5. Verificar estrutura da tabela tenants
SELECT 
    '=== ESTRUTURA DA TABELA TENANTS ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- 6. Tentar inserção manual de teste
DO $$
DECLARE
    new_tenant_id UUID;
    new_tenant_user_id UUID;
BEGIN
    RAISE NOTICE '=== TESTE DE INSERÇÃO MANUAL ===';
    
    -- Inserir tenant
    INSERT INTO tenants (name, description, owner_id, active)
    VALUES ('Empresa Teste Debug', 'Teste de criação manual', auth.uid(), TRUE)
    RETURNING id INTO new_tenant_id;
    
    RAISE NOTICE 'Tenant criado com sucesso! ID: %', new_tenant_id;
    
    -- Inserir tenant_user
    INSERT INTO tenant_users (tenant_id, user_id, role, active)
    VALUES (new_tenant_id, auth.uid(), 'admin', TRUE)
    RETURNING id INTO new_tenant_user_id;
    
    RAISE NOTICE 'TenantUser criado com sucesso! ID: %', new_tenant_user_id;
    
    -- Verificar se consegue consultar
    IF EXISTS (SELECT 1 FROM tenants WHERE id = new_tenant_id) THEN
        RAISE NOTICE 'Tenant visível após criação: SIM';
    ELSE
        RAISE NOTICE 'Tenant visível após criação: NÃO';
    END IF;
    
    -- Limpar teste
    DELETE FROM tenant_users WHERE id = new_tenant_user_id;
    DELETE FROM tenants WHERE id = new_tenant_id;
    
    RAISE NOTICE 'Teste concluído e dados limpos';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO no teste: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- 7. Verificar tenants existentes
SELECT 
    '=== TENANTS EXISTENTES ===' as info,
    COUNT(*) as total
FROM tenants;

SELECT * FROM tenants LIMIT 5;

-- 8. Verificar tenant_users existentes
SELECT 
    '=== TENANT_USERS EXISTENTES ===' as info,
    COUNT(*) as total
FROM tenant_users;

SELECT * FROM tenant_users LIMIT 5;

-- 9. Status final
SELECT 
    '=== STATUS FINAL ===' as info,
    CASE 
        WHEN is_super_admin_safe() THEN 'SUPER ADMIN - Pode criar empresas'
        ELSE 'USUÁRIO NORMAL - Verificar permissões'
    END as status;