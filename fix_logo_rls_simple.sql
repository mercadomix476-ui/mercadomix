-- Simple fix for logo RLS policies
-- This will allow the logo system to work without multi-tenant complexity

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view logos from their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can manage logos in their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can view logo history from their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can manage logo history in their tenants" ON logo_change_history;

-- Create simple policies that allow authenticated users to manage logos
CREATE POLICY "Authenticated users can view store logos" ON store_logos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage store logos" ON store_logos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view logo history" ON logo_change_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage logo history" ON logo_change_history
    FOR ALL USING (auth.role() = 'authenticated');

-- If the table still uses tenant_id, let's add a store_id column and update it
DO $$ 
BEGIN
    -- Check if we need to add store_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_logos' AND column_name = 'store_id') THEN
        ALTER TABLE store_logos ADD COLUMN store_id TEXT DEFAULT 'default-store';
    END IF;
    
    -- Update any NULL store_id values
    UPDATE store_logos SET store_id = 'default-store' WHERE store_id IS NULL;
END $$;

-- Same for logo_change_history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'logo_change_history' AND column_name = 'store_id') THEN
        ALTER TABLE logo_change_history ADD COLUMN store_id TEXT DEFAULT 'default-store';
    END IF;
    
    UPDATE logo_change_history SET store_id = 'default-store' WHERE store_id IS NULL;
END $$;