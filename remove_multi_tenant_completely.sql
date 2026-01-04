-- Remove ALL multi-tenant functionality from the database
-- This script will convert the system to single-tenant

-- First, check what foreign key constraints exist on store_logos
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'store_logos';

-- Drop the foreign key constraint directly
ALTER TABLE store_logos DROP CONSTRAINT IF EXISTS store_logos_tenant_id_fkey;

-- Remove ALL existing policies first (they depend on tenant_id columns)
DROP POLICY IF EXISTS "Users can insert logo history in their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can view logo history in their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can manage logo history in their tenants" ON logo_change_history;
-- Remove ALL existing policies first (they depend on tenant_id columns)
DROP POLICY IF EXISTS "Users can insert logo history in their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can view logo history in their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can manage logo history in their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can view logos from their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can manage logos in their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can insert logos in their tenants" ON store_logos;
DROP POLICY IF EXISTS "Authenticated users can view store logos" ON store_logos;
DROP POLICY IF EXISTS "Authenticated users can manage store logos" ON store_logos;
DROP POLICY IF EXISTS "Authenticated users can view logo history" ON logo_change_history;
DROP POLICY IF EXISTS "Authenticated users can manage logo history" ON logo_change_history;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON store_logos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON logo_change_history;

-- Now remove tenant_id columns
ALTER TABLE store_logos DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE logo_change_history DROP COLUMN IF EXISTS tenant_id CASCADE;

-- Drop any tenant-related tables completely
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS tenant_settings CASCADE;

-- Create simple policies for store_logos
CREATE POLICY "Allow all for authenticated users" ON store_logos
    FOR ALL USING (auth.role() = 'authenticated');

-- Create simple policies for logo_change_history  
CREATE POLICY "Allow all for authenticated users" ON logo_change_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Test insert to verify it works
INSERT INTO store_logos (
    store_id,
    logo_url,
    original_filename,
    file_size,
    mime_type,
    is_active
) VALUES (
    'default-store',
    'test-single-tenant',
    'test.jpg',
    1000,
    'image/jpeg',
    false
);

-- Clean up test record
DELETE FROM store_logos WHERE logo_url = 'test-single-tenant';

-- Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_logos'
ORDER BY ordinal_position;