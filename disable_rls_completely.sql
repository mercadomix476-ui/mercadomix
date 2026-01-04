-- Disable RLS completely to test if that's the issue

-- Disable RLS on both tables
ALTER TABLE store_logos DISABLE ROW LEVEL SECURITY;
ALTER TABLE logo_change_history DISABLE ROW LEVEL SECURITY;

-- Test insert without RLS
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
            'test-no-rls',
            'test.jpg',
            1000,
            'image/jpeg',
            false
        );
        RAISE NOTICE 'Test insert without RLS: SUCCESS';
        
        -- Clean up test record
        DELETE FROM store_logos WHERE logo_url = 'test-no-rls';
        RAISE NOTICE 'Test cleanup: SUCCESS';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Test insert still failed even without RLS: %', SQLERRM;
    END;
END $$;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('store_logos', 'logo_change_history');