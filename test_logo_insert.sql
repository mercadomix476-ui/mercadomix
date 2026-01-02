-- Test script to diagnose the logo upload issue

-- First, let's check if the table exists and its structure
SELECT 'Checking store_logos table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_logos'
ORDER BY ordinal_position;

-- Check current policies
SELECT 'Current policies on store_logos:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'store_logos';

-- Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'store_logos';

-- Try to insert a test record to see what happens
SELECT 'Attempting test insert:' as info;
DO $$
BEGIN
    BEGIN
        INSERT INTO store_logos (
            store_id,
            logo_url,
            original_filename,
            file_size,
            mime_type,
            uploaded_by,
            is_active
        ) VALUES (
            'default-store',
            'test-url',
            'test.jpg',
            1000,
            'image/jpeg',
            auth.uid(),
            true
        );
        RAISE NOTICE 'Test insert successful';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
    END;
END $$;

-- Check current user context
SELECT 'Current user context:' as info;
SELECT 
    auth.uid() as user_id,
    auth.role() as user_role,
    current_user as current_user;

-- Clean up test record if it was inserted
DELETE FROM store_logos WHERE logo_url = 'test-url';