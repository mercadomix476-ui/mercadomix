-- Create logo tables for single-tenant system
-- This script will create the tables from scratch if they don't exist

-- Create store_logos table
CREATE TABLE IF NOT EXISTS store_logos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'default-store',
    logo_url TEXT,
    original_filename TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create logo_change_history table
CREATE TABLE IF NOT EXISTS logo_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'default-store',
    action TEXT NOT NULL, -- 'upload', 'remove', 'replace'
    old_logo_url TEXT,
    new_logo_url TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE store_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_change_history ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view logos from their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can manage logos in their tenants" ON store_logos;
DROP POLICY IF EXISTS "Users can view logo history from their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Users can manage logo history in their tenants" ON logo_change_history;
DROP POLICY IF EXISTS "Authenticated users can view store logos" ON store_logos;
DROP POLICY IF EXISTS "Authenticated users can manage store logos" ON store_logos;
DROP POLICY IF EXISTS "Authenticated users can view logo history" ON logo_change_history;
DROP POLICY IF EXISTS "Authenticated users can manage logo history" ON logo_change_history;

-- Create simple policies that allow all authenticated users
CREATE POLICY "Allow all for authenticated users" ON store_logos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON logo_change_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_logos_store_id ON store_logos(store_id);
CREATE INDEX IF NOT EXISTS idx_store_logos_is_active ON store_logos(is_active);
CREATE INDEX IF NOT EXISTS idx_store_logos_uploaded_by ON store_logos(uploaded_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_store_logos_updated_at ON store_logos;
CREATE TRIGGER update_store_logos_updated_at
    BEFORE UPDATE ON store_logos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for the bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to logos" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
    FOR ALL USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'store-logos');