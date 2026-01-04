-- =============================================
-- FIX PARA CRIAÇÃO DE EMPRESAS (TENANTS)
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário atual e perfil
SELECT 
    'VERIFICAÇÃO INICIAL' as step,
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
    (SELECT role FROM profiles WHERE id = auth.uid()) as current_role,
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) as is_super_admin;

-- 2. Garantir que o perfil está correto
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
    is_active = TRUE,
    updated_at = NOW();

-- 3. Verificar se as funções helper existem
SELECT 
    'VERIFICANDO FUNÇÕES' as step,
    EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_super_admin_safe'
    ) as has_super_admin_function,
    EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_user_tenant_ids'
    ) as has_tenant_ids_function;

-- 4. Recriar funções se necessário
CREATE OR REPLACE FUNCTION is_super_admin_safe(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = COALESCE(user_id, auth.uid())
        AND (role = 'super_admin' OR is_super_admin = TRUE)
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_tenant_ids(user_id UUID DEFAULT auth.uid())
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT tenant_id 
        FROM tenant_users 
        WHERE user_id = COALESCE($1, auth.uid()) AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar policies de inserção para tenants
SELECT 
    'VERIFICANDO POLICIES' as step,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'tenants' AND cmd = 'INSERT';

-- 6. Testar se consegue inserir um tenant
DO $$
DECLARE
    test_tenant_id UUID;
BEGIN
    -- Tentar inserir um tenant de teste
    INSERT INTO tenants (name, description, owner_id, active)
    VALUES ('Teste Criação', 'Tenant de teste', auth.uid(), TRUE)
    RETURNING id INTO test_tenant_id;
    
    RAISE NOTICE 'SUCESSO: Tenant de teste criado com ID: %', test_tenant_id;
    
    -- Remover o tenant de teste
    DELETE FROM tenants WHERE id = test_tenant_id;
    RAISE NOTICE 'Tenant de teste removido';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO ao criar tenant: %', SQLERRM;
END $$;

-- 7. Verificar se consegue inserir tenant_users
DO $$
DECLARE
    test_tenant_id UUID;
BEGIN
    -- Criar tenant de teste
    INSERT INTO tenants (name, owner_id, active)
    VALUES ('Teste TenantUser', auth.uid(), TRUE)
    RETURNING id INTO test_tenant_id;
    
    -- Tentar inserir tenant_user
    INSERT INTO tenant_users (tenant_id, user_id, role, active)
    VALUES (test_tenant_id, auth.uid(), 'admin', TRUE);
    
    RAISE NOTICE 'SUCESSO: TenantUser criado para tenant: %', test_tenant_id;
    
    -- Limpar
    DELETE FROM tenant_users WHERE tenant_id = test_tenant_id;
    DELETE FROM tenants WHERE id = test_tenant_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO ao criar tenant_user: %', SQLERRM;
    -- Tentar limpar mesmo com erro
    BEGIN
        DELETE FROM tenant_users WHERE tenant_id = test_tenant_id;
        DELETE FROM tenants WHERE id = test_tenant_id;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignorar erros de limpeza
    END;
END $$;

-- 8. Verificar resultado final
SELECT 
    'VERIFICAÇÃO FINAL' as step,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT role FROM profiles WHERE id = auth.uid()) as user_role,
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) as is_super_admin,
    'Pronto para criar empresas!' as status;