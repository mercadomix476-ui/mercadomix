-- =============================================
-- SUPABASE STORAGE SETUP FOR STORE LOGOS
-- =============================================
-- This script sets up the storage bucket and policies for store logos
-- Requirements: 4.4, 1.3

-- =============================================
-- STORAGE BUCKET CREATION
-- =============================================
-- Note: This needs to be executed in Supabase dashboard or via API
-- The bucket should be created with the following settings:
-- - Name: 'store-logos'
-- - Public: false (private bucket)
-- - File size limit: 2MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-logos',
  'store-logos',
  false,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Policy to allow users to view logos from their tenants
DROP POLICY IF EXISTS "Users can view logos from their tenants" ON storage.objects;
CREATE POLICY "Users can view logos from their tenants" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Policy to allow users to upload logos to their tenants
DROP POLICY IF EXISTS "Users can upload logos to their tenants" ON storage.objects;
CREATE POLICY "Users can upload logos to their tenants" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Policy to allow users to update logos in their tenants
DROP POLICY IF EXISTS "Users can update logos in their tenants" ON storage.objects;
CREATE POLICY "Users can update logos in their tenants" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Policy to allow users to delete logos from their tenants
DROP POLICY IF EXISTS "Users can delete logos from their tenants" ON storage.objects;
CREATE POLICY "Users can delete logos from their tenants" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get the current active logo for a tenant
CREATE OR REPLACE FUNCTION get_tenant_logo(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  logo_url TEXT;
BEGIN
  SELECT store_logos.logo_url INTO logo_url
  FROM store_logos
  WHERE tenant_id = tenant_uuid AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN logo_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create logo change history entry
CREATE OR REPLACE FUNCTION log_logo_change(
  tenant_uuid UUID,
  change_action TEXT,
  old_url TEXT DEFAULT NULL,
  new_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  history_id UUID;
BEGIN
  INSERT INTO logo_change_history (
    tenant_id,
    action,
    old_logo_url,
    new_logo_url,
    changed_by
  ) VALUES (
    tenant_uuid,
    change_action,
    old_url,
    new_url,
    auth.uid()
  ) RETURNING id INTO history_id;
  
  RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON FUNCTION get_tenant_logo(UUID) IS 'Returns the current active logo URL for a tenant';
COMMENT ON FUNCTION log_logo_change(UUID, TEXT, TEXT, TEXT) IS 'Creates an audit trail entry for logo changes';