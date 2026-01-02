-- Create storage bucket for logos

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'store-logos';

-- Remove any existing storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Create simple storage policies
CREATE POLICY "Allow all operations on store-logos" ON storage.objects
    FOR ALL USING (bucket_id = 'store-logos');

-- Show current storage policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';