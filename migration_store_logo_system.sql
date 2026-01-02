-- =============================================
-- STORE LOGO SYSTEM MIGRATION
-- =============================================
-- This migration creates the database schema for the store logo upload system
-- Requirements: 4.4, 1.3

-- 1. Create store_logos table
CREATE TABLE IF NOT EXISTS store_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create logo_change_history table for audit trail
CREATE TABLE IF NOT EXISTS logo_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('upload', 'remove', 'replace')),
  old_logo_url TEXT,
  new_logo_url TEXT,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for store_logos
CREATE INDEX IF NOT EXISTS idx_store_logos_tenant_id ON store_logos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_logos_is_active ON store_logos(is_active);
CREATE INDEX IF NOT EXISTS idx_store_logos_uploaded_by ON store_logos(uploaded_by);

-- Indexes for logo_change_history
CREATE INDEX IF NOT EXISTS idx_logo_change_history_tenant_id ON logo_change_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logo_change_history_changed_by ON logo_change_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_logo_change_history_changed_at ON logo_change_history(changed_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on the new tables
ALTER TABLE store_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_change_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Policies for store_logos
DROP POLICY IF EXISTS "Users can view logos from their tenants" ON store_logos;
CREATE POLICY "Users can view logos from their tenants" ON store_logos
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage logos in their tenants" ON store_logos;
CREATE POLICY "Users can manage logos in their tenants" ON store_logos
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Policies for logo_change_history
DROP POLICY IF EXISTS "Users can view logo history from their tenants" ON logo_change_history;
CREATE POLICY "Users can view logo history from their tenants" ON logo_change_history
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Users can insert logo history in their tenants" ON logo_change_history;
CREATE POLICY "Users can insert logo history in their tenants" ON logo_change_history
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger for store_logos updated_at
DROP TRIGGER IF EXISTS update_store_logos_updated_at ON store_logos;
CREATE TRIGGER update_store_logos_updated_at
    BEFORE UPDATE ON store_logos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET SETUP
-- =============================================

-- Note: Storage bucket creation and policies need to be set up in Supabase dashboard or via API
-- Bucket name: 'store-logos'
-- Structure: store-logos/{tenant_id}/current/logo.{ext}
--           store-logos/{tenant_id}/history/{timestamp}_logo.{ext}

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE store_logos IS 'Store logo configurations for each tenant';
COMMENT ON TABLE logo_change_history IS 'Audit trail for logo changes';
COMMENT ON COLUMN store_logos.tenant_id IS 'ID of the tenant that owns this logo';
COMMENT ON COLUMN store_logos.logo_url IS 'URL to the logo file in Supabase Storage';
COMMENT ON COLUMN store_logos.is_active IS 'Whether this logo is currently active';
COMMENT ON COLUMN logo_change_history.action IS 'Type of change: upload, remove, or replace';
COMMENT ON COLUMN logo_change_history.tenant_id IS 'ID of the tenant for this logo change';