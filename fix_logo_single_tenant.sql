-- Fix logo system to work as single-tenant
-- Remove multi-tenant complexity and use simple store_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view logos from their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can manage logos in their tenants" ON store_logos;

-- Alter table to use store_id instead of tenant_id
ALTER TABLE store_logos 
DROP CONSTRAINT IF EXISTS store_logos_tenant_id_fkey;

-- Add store_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_logos' AND column_name = 'store_id') THEN
        ALTER TABLE store_logos ADD COLUMN store_id TEXT;
    END IF;
END $$;

-- Update existing records to use default store_id
UPDATE store_logos SET store_id = 'default-store' WHERE store_id IS NULL;

-- Make store_id NOT NULL
ALTER TABLE store_logos ALTER COLUMN store_id SET NOT NULL;

-- Drop tenant_id column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'store_logos' AND column_name = 'tenant_id') THEN
        ALTER TABLE store_logos DROP COLUMN tenant_id;
    END IF;
END $$;

-- Create simple policies for single-tenant
CREATE POLICY "Anyone can view store logos" ON store_logos
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage store logos" ON store_logos
    FOR ALL USING (auth.role() = 'authenticated');

-- Update indexes
DROP INDEX IF EXISTS idx_store_logos_tenant_id;
CREATE INDEX IF NOT EXISTS idx_store_logos_store_id ON store_logos(store_id);

-- Fix logo_change_history table similarly
DROP POLICY IF EXISTS "Users can view logo history from their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can manage logo history in their tenants" ON logo_change_history;

-- Add store_id to logo_change_history if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'logo_change_history' AND column_name = 'store_id') THEN
        ALTER TABLE logo_change_history ADD COLUMN store_id TEXT;
    END IF;
END $$;

-- Update existing history records
UPDATE logo_change_history SET store_id = 'default-store' WHERE store_id IS NULL;

-- Make store_id NOT NULL in history table
ALTER TABLE logo_change_history ALTER COLUMN store_id SET NOT NULL;

-- Drop tenant_id from history table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'logo_change_history' AND column_name = 'tenant_id') THEN
        ALTER TABLE logo_change_history DROP COLUMN tenant_id;
    END IF;
END $$;

-- Create simple policies for logo history
CREATE POLICY "Anyone can view logo history" ON logo_change_history
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage logo history" ON logo_change_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Update comments
COMMENT ON TABLE store_logos IS 'Store logo configuration (single-tenant)';
COMMENT ON COLUMN store_logos.store_id IS 'ID of the store (default: default-store)';
COMMENT ON COLUMN store_logos.logo_url IS 'URL to the logo file in Supabase Storage';
COMMENT ON COLUMN store_logos.is_active IS 'Whether this logo is currently active';

COMMENT ON TABLE logo_change_history IS 'Audit trail for logo changes (single-tenant)';
COMMENT ON COLUMN logo_change_history.store_id IS 'ID of the store for this logo change';