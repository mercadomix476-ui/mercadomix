-- Fix the tenant_id column issue once and for all

-- First, let's see the current structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'store_logos' 
ORDER BY ordinal_position;

-- Option 1: Make tenant_id nullable and set a default
ALTER TABLE store_logos ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE store_logos ALTER COLUMN tenant_id SET DEFAULT 'default-tenant';

-- Update any existing NULL values
UPDATE store_logos SET tenant_id = 'default-tenant' WHERE tenant_id IS NULL;

-- Do the same for logo_change_history if it has tenant_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'logo_change_history' AND column_name = 'tenant_id') THEN
        ALTER TABLE logo_change_history ALTER COLUMN tenant_id DROP NOT NULL;
        ALTER TABLE logo_change_history ALTER COLUMN tenant_id SET DEFAULT 'default-tenant';
        UPDATE logo_change_history SET tenant_id = 'default-tenant' WHERE tenant_id IS NULL;
    END IF;
END $$;

-- Test insert to make sure it works now
DO $$
BEGIN
    BEGIN
        INSERT INTO store_logos (
            store_id,
            logo_url,
            original_filename,
            file_size,
            mime_type,
            is_active
        ) VALUES (
            'default-store',
            'test-tenant-fix',
            'test.jpg',
            1000,
            'image/jpeg',
            false
        );
        RAISE NOTICE 'Test insert after tenant_id fix: SUCCESS';
        
        -- Clean up test record
        DELETE FROM store_logos WHERE logo_url = 'test-tenant-fix';
        RAISE NOTICE 'Test cleanup: SUCCESS';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Test insert still failed: %', SQLERRM;
    END;
END $$;

-- Show final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'store_logos' 
ORDER BY ordinal_position;