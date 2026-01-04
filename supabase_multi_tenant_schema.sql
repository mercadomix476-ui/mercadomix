-- =============================================
-- SCHEMA MULTI-TENANT PARA NEXUS COMMERCE
-- =============================================

-- 1. Tabela de Tenants (Empresas)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cnpj VARCHAR(18),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- 2. Tabela de relacionamento Tenant-User (Usuários por empresa)
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

-- 3. Atualizar tabela de produtos para incluir tenant_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Atualizar tabela de vendas para incluir tenant_id
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Atualizar tabela de itens de venda para incluir tenant_id
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. Atualizar tabela de movimentações de estoque para incluir tenant_id
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 7. Atualizar tabela de configurações da loja para incluir tenant_id
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para tenant_id em todas as tabelas
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_id ON sale_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_settings_tenant_id ON store_settings(tenant_id);

-- Índices para tenant_users
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);

-- Índices para tenants
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- Políticas para tenants
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
CREATE POLICY "Users can create tenants" ON tenants
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Tenant owners can update their tenants" ON tenants;
CREATE POLICY "Tenant owners can update their tenants" ON tenants
    FOR UPDATE USING (auth.uid() = owner_id);

-- Políticas para tenant_users
DROP POLICY IF EXISTS "Users can view their tenant relationships" ON tenant_users;
CREATE POLICY "Users can view their tenant relationships" ON tenant_users
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Tenant owners can manage tenant users" ON tenant_users;
CREATE POLICY "Tenant owners can manage tenant users" ON tenant_users
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM tenants WHERE owner_id = auth.uid()
        )
    );

-- Políticas para products
DROP POLICY IF EXISTS "Users can view products from their tenants" ON products;
CREATE POLICY "Users can view products from their tenants" ON products
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage products in their tenants" ON products;
CREATE POLICY "Users can manage products in their tenants" ON products
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para sales
DROP POLICY IF EXISTS "Users can view sales from their tenants" ON sales;
CREATE POLICY "Users can view sales from their tenants" ON sales
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage sales in their tenants" ON sales;
CREATE POLICY "Users can manage sales in their tenants" ON sales
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para sale_items
DROP POLICY IF EXISTS "Users can view sale items from their tenants" ON sale_items;
CREATE POLICY "Users can view sale items from their tenants" ON sale_items
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage sale items in their tenants" ON sale_items;
CREATE POLICY "Users can manage sale items in their tenants" ON sale_items
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para stock_movements
DROP POLICY IF EXISTS "Users can view stock movements from their tenants" ON stock_movements;
CREATE POLICY "Users can view stock movements from their tenants" ON stock_movements
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage stock movements in their tenants" ON stock_movements;
CREATE POLICY "Users can manage stock movements in their tenants" ON stock_movements
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Políticas para store_settings
DROP POLICY IF EXISTS "Users can view store settings from their tenants" ON store_settings;
CREATE POLICY "Users can view store settings from their tenants" ON store_settings
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage store settings in their tenants" ON store_settings;
CREATE POLICY "Users can manage store settings in their tenants" ON store_settings
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para tenant_users
DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON tenant_users;
CREATE TRIGGER update_tenant_users_updated_at
    BEFORE UPDATE ON tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE tenants IS 'Tabela de empresas/inquilinos do sistema multi-tenant';
COMMENT ON TABLE tenant_users IS 'Relacionamento entre usuários e empresas com roles específicos';
COMMENT ON COLUMN products.tenant_id IS 'ID da empresa proprietária do produto';
COMMENT ON COLUMN sales.tenant_id IS 'ID da empresa proprietária da venda';
COMMENT ON COLUMN sale_items.tenant_id IS 'ID da empresa proprietária do item de venda';
COMMENT ON COLUMN stock_movements.tenant_id IS 'ID da empresa proprietária da movimentação';
COMMENT ON COLUMN store_settings.tenant_id IS 'ID da empresa proprietária das configurações';