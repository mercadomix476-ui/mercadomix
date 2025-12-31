-- =============================================
-- CONFIGURAÇÃO DE SUPER USUÁRIO
-- =============================================
-- Este script configura ederportelalima@hotmail.com como super admin
-- com acesso a todos os tenants do sistema

-- 1. Primeiro, vamos adicionar uma coluna para identificar super admins
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Criar função para verificar se um usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_super_admin = TRUE 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Configurar ederportelalima@hotmail.com como super admin
-- Primeiro, vamos encontrar o usuário
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar o usuário pelo email
    SELECT id, email INTO user_record
    FROM auth.users 
    WHERE email = 'ederportelalima@hotmail.com';
    
    IF user_record.id IS NOT NULL THEN
        -- Inserir ou atualizar o perfil como super admin
        INSERT INTO profiles (id, email, full_name, role, is_active, is_super_admin)
        VALUES (
            user_record.id,
            user_record.email,
            'Eder Portal - Super Admin',
            'super_admin',
            TRUE,
            TRUE
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = 'super_admin',
            is_active = TRUE,
            is_super_admin = TRUE,
            updated_at = NOW();
            
        RAISE NOTICE 'Super admin configurado com sucesso para: %', user_record.email;
    ELSE
        RAISE NOTICE 'Usuário ederportelalima@hotmail.com não encontrado. Certifique-se de que ele já se registrou no sistema.';
    END IF;
END $$;

-- 4. Atualizar as políticas RLS para permitir acesso total aos super admins

-- Políticas para tenants
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todos os tenants
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Tenant owners can update their tenants" ON tenants;
CREATE POLICY "Tenant owners can update their tenants" ON tenants
    FOR UPDATE USING (
        is_super_admin() OR  -- Super admins podem editar qualquer tenant
        auth.uid() = owner_id
    );

-- Políticas para tenant_users
DROP POLICY IF EXISTS "Users can view their tenant relationships" ON tenant_users;
CREATE POLICY "Users can view their tenant relationships" ON tenant_users
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todas as relações
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Tenant owners can manage tenant users" ON tenant_users;
CREATE POLICY "Tenant owners can manage tenant users" ON tenant_users
    FOR ALL USING (
        is_super_admin() OR  -- Super admins podem gerenciar qualquer relação
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

-- Políticas para products
DROP POLICY IF EXISTS "Users can view products from their tenants" ON products;
CREATE POLICY "Users can view products from their tenants" ON products
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todos os produtos
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage products in their tenants" ON products;
CREATE POLICY "Users can manage products in their tenants" ON products
    FOR ALL USING (
        is_super_admin() OR  -- Super admins podem gerenciar todos os produtos
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para sales
DROP POLICY IF EXISTS "Users can view sales from their tenants" ON sales;
CREATE POLICY "Users can view sales from their tenants" ON sales
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todas as vendas
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage sales in their tenants" ON sales;
CREATE POLICY "Users can manage sales in their tenants" ON sales
    FOR ALL USING (
        is_super_admin() OR  -- Super admins podem gerenciar todas as vendas
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para sale_items
DROP POLICY IF EXISTS "Users can view sale items from their tenants" ON sale_items;
CREATE POLICY "Users can view sale items from their tenants" ON sale_items
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todos os itens de venda
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage sale items in their tenants" ON sale_items;
CREATE POLICY "Users can manage sale items in their tenants" ON sale_items
    FOR ALL USING (
        is_super_admin() OR  -- Super admins podem gerenciar todos os itens
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para stock_movements
DROP POLICY IF EXISTS "Users can view stock movements from their tenants" ON stock_movements;
CREATE POLICY "Users can view stock movements from their tenants" ON stock_movements
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todas as movimentações
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage stock movements in their tenants" ON stock_movements;
CREATE POLICY "Users can manage stock movements in their tenants" ON stock_movements
    FOR ALL USING (
        is_super_admin() OR  -- Super admins podem gerenciar todas as movimentações
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para store_settings
DROP POLICY IF EXISTS "Users can view store settings from their tenants" ON store_settings;
CREATE POLICY "Users can view store settings from their tenants" ON store_settings
    FOR SELECT USING (
        is_super_admin() OR  -- Super admins veem todas as configurações
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage store settings in their tenants" ON store_settings;
CREATE POLICY "Users can manage store settings in their tenants" ON store_settings
    FOR ALL USING (
        is_super_admin() OR  -- Super admins podem gerenciar todas as configurações
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- 5. Criar função para adicionar super admin a todos os tenants automaticamente
CREATE OR REPLACE FUNCTION add_super_admin_to_all_tenants()
RETURNS VOID AS $$
DECLARE
    super_admin_id UUID;
    tenant_record RECORD;
BEGIN
    -- Buscar o ID do super admin
    SELECT id INTO super_admin_id
    FROM profiles 
    WHERE is_super_admin = TRUE 
    AND email = 'ederportelalima@hotmail.com'
    LIMIT 1;
    
    IF super_admin_id IS NOT NULL THEN
        -- Adicionar o super admin a todos os tenants existentes
        FOR tenant_record IN SELECT id FROM tenants WHERE active = TRUE LOOP
            INSERT INTO tenant_users (tenant_id, user_id, role, active)
            VALUES (tenant_record.id, super_admin_id, 'super_admin', TRUE)
            ON CONFLICT (tenant_id, user_id) 
            DO UPDATE SET 
                role = 'super_admin',
                active = TRUE,
                updated_at = NOW();
        END LOOP;
        
        RAISE NOTICE 'Super admin adicionado a todos os tenants existentes';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Executar a função para adicionar o super admin aos tenants existentes
SELECT add_super_admin_to_all_tenants();

-- 7. Criar trigger para adicionar super admin automaticamente a novos tenants
CREATE OR REPLACE FUNCTION auto_add_super_admin_to_new_tenant()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    -- Buscar o ID do super admin
    SELECT id INTO super_admin_id
    FROM profiles 
    WHERE is_super_admin = TRUE 
    AND email = 'ederportelalima@hotmail.com'
    LIMIT 1;
    
    IF super_admin_id IS NOT NULL THEN
        -- Adicionar o super admin ao novo tenant
        INSERT INTO tenant_users (tenant_id, user_id, role, active)
        VALUES (NEW.id, super_admin_id, 'super_admin', TRUE)
        ON CONFLICT (tenant_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_add_super_admin_to_new_tenant ON tenants;
CREATE TRIGGER trigger_add_super_admin_to_new_tenant
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_super_admin_to_new_tenant();

-- 8. Verificar se tudo foi configurado corretamente e mostrar resultados
DO $$
DECLARE
    super_admin_count INTEGER;
    tenant_access_count INTEGER;
BEGIN
    -- Contar super admins
    SELECT COUNT(*) INTO super_admin_count
    FROM profiles p
    WHERE p.is_super_admin = TRUE;
    
    -- Contar acessos a tenants
    SELECT COUNT(*) INTO tenant_access_count
    FROM tenant_users tu
    JOIN profiles p ON tu.user_id = p.id
    WHERE p.is_super_admin = TRUE;
    
    RAISE NOTICE 'Configuração de super admin concluída!';
    RAISE NOTICE 'Super admins configurados: %', super_admin_count;
    RAISE NOTICE 'Total de acessos a tenants: %', tenant_access_count;
    RAISE NOTICE 'O usuário ederportelalima@hotmail.com agora tem acesso total a todos os tenants.';
END $$;

-- Mostrar detalhes dos super admins configurados
SELECT 
    p.email,
    p.full_name,
    p.role,
    p.is_super_admin,
    p.is_active,
    p.created_at
FROM profiles p
WHERE p.is_super_admin = TRUE;

-- Mostrar quantos tenants cada super admin tem acesso
SELECT 
    p.email,
    p.full_name,
    COUNT(tu.tenant_id) as total_tenants_with_access
FROM profiles p
LEFT JOIN tenant_users tu ON p.id = tu.user_id
WHERE p.is_super_admin = TRUE
GROUP BY p.id, p.email, p.full_name;