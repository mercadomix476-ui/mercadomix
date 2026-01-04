-- Debug script to check the current state of logo tables

-- Check if store_logos table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_logos'
ORDER BY ordinal_position;

-- Check current policies on store_logos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'store_logos';

-- Check if logo_change_history table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'logo_change_history'
ORDER BY ordinal_position;

-- Check current data in store_logos (if any)
SELECT * FROM store_logos LIMIT 5;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('store_logos', 'logo_change_history');