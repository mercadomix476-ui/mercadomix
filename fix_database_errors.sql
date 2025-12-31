-- FIX URGENTE - ERROS 500 NO BANCO
-- Execute este script COMPLETO no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
    'Verificando tabelas...' as status,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') as tenants_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as profiles_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users') as tenant_users_exists;

-- 2. Criar tabela tenants se não existir
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cnpj VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela tenant_users se não existir
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'operator',
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, user_id)
);

-- 4. Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 5. Criar função is_super_admin se não existir
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND (role = 'super_admin' OR is_super_admin = TRUE)
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Políticas para tenants (SIMPLES)
DROP POLICY IF EXISTS "Super admin can do everything on tenants" ON tenants;
CREATE POLICY "Super admin can do everything on tenants" ON tenants
    FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
CREATE POLICY "Users can view their tenants" ON tenants
    FOR SELECT USING (
        is_super_admin() OR
        owner_id = auth.uid() OR
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
CREATE POLICY "Users can create tenants" ON tenants
    FOR INSERT WITH CHECK (
        is_super_admin() OR
        auth.uid() = owner_id
    );

-- 7. Políticas para tenant_users (SIMPLES)
DROP POLICY IF EXISTS "Super admin can do everything on tenant_users" ON tenant_users;
CREATE POLICY "Super admin can do everything on tenant_users" ON tenant_users
    FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Users can view their relationships" ON tenant_users;
CREATE POLICY "Users can view their relationships" ON tenant_users
    FOR SELECT USING (
        is_super_admin() OR
        user_id = auth.uid()
    );

-- 8. Configurar seu usuário como super admin
UPDATE profiles 
SET 
    role = 'super_admin',
    is_super_admin = TRUE,
    is_active = TRUE
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ederportelalima@hotmail.com'
);

-- 9. Criar tenant de teste
INSERT INTO tenants (id, name, active, owner_id)
SELECT 
    gen_random_uuid(),
    'Mercadinho Central',
    TRUE,
    u.id
FROM auth.users u
WHERE u.email = 'ederportelalima@hotmail.com'
AND NOT EXISTS (SELECT 1 FROM tenants WHERE name = 'Mercadinho Central');

-- 10. Adicionar super admin ao tenant
INSERT INTO tenant_users (tenant_id, user_id, role, active)
SELECT 
    t.id,
    u.id,
    'super_admin',
    TRUE
FROM tenants t
CROSS JOIN auth.users u
WHERE t.name = 'Mercadinho Central'
AND u.email = 'ederportelalima@hotmail.com'
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 11. Verificar se funcionou
SELECT 
    'SUCESSO! Banco configurado!' as status,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM tenant_users) as total_tenant_users,
    (SELECT COUNT(*) FROM profiles WHERE is_super_admin = TRUE) as super_admins;