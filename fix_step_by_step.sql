-- PASSO 1: Criar tabela tenants
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

-- PASSO 2: Criar tabela tenant_users
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

-- PASSO 3: Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Função super admin
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

-- PASSO 5: Política simples para tenants
DROP POLICY IF EXISTS "Allow super admin all access" ON tenants;
CREATE POLICY "Allow super admin all access" ON tenants
    FOR ALL USING (is_super_admin());

-- PASSO 6: Política simples para tenant_users  
DROP POLICY IF EXISTS "Allow super admin all access" ON tenant_users;
CREATE POLICY "Allow super admin all access" ON tenant_users
    FOR ALL USING (is_super_admin());

-- PASSO 7: Verificar resultado
SELECT 'Tabelas criadas com sucesso!' as status;