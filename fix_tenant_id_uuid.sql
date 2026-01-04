-- Fix the tenant_id UUID column issue

-- First, let's see the current structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'store_logos' 
ORDER BY ordinal_position;

-- Generate a default UUID for tenant_id
DO $$
DECLARE
    default_tenant_uuid UUID := gen_random_uuid();
BEGIN
    -- Make tenant_id nullable first
    ALTER TABLE store_logos ALTER COLUMN tenant_id DROP NOT NULL;
    
    -- Set a default UUID value
    EXECUTE format('ALTER TABLE store_logos ALTER COLUMN tenant_id SET DEFAULT %L', default_tenant_uuid);
    
    -- Update any existing NULL values with the same UUID
    EXECUTE format('UPDATE store_logos SET tenant_id = %L WHERE tenant_id IS NULL', default_tenant_uuid);
    
    RAISE NOTICE 'Set default tenant_id to: %', default_tenant_uuid;
END $$;

-- Do the same for logo_change_history if it has tenant_id
DO $$
DECLARE
    default_tenant_uuid UUID := gen_random_uuid();
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'logo_change_history' AND column_name = 'tenant_id') THEN
        ALTER TABLE logo_change_history ALTER COLUMN tenant_id DROP NOT NULL;
        EXECUTE format('ALTER TABLE logo_change_history ALTER COLUMN tenant_id SET DEFAULT %L', default_tenant_uuid);
        EXECUTE format('UPDATE logo_change_history SET tenant_id = %L WHERE tenant_id IS NULL', default_tenant_uuid);
        RAISE NOTICE 'Set default tenant_id for history to: %', default_tenant_uuid;
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
            'test-uuid-fix',
            'test.jpg',
            1000,
            'image/jpeg',
            false
        );
        RAISE NOTICE 'Test insert after UUID fix: SUCCESS';
        
        -- Clean up test record
        DELETE FROM store_logos WHERE logo_url = 'test-uuid-fix';
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