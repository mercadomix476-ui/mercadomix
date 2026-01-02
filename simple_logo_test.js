// Simple test to isolate the problem
// Run this in the browser console on your app

async function testSimpleLogoInsert() {
  console.log('Testing simple logo insert...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Auth error:', userError);
      return;
    }
    console.log('Current user:', user?.id);

    // Try the simplest possible insert
    const { data, error } = await supabase
      .from('store_logos')
      .insert({
        store_id: 'default-store',
        logo_url: 'https://example.com/test.jpg',
        original_filename: 'test.jpg',
        file_size: 1000,
        mime_type: 'image/jpeg',
        uploaded_by: user?.id,
        is_active: false
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('Insert successful:', data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('store_logos')
          .delete()
          .eq('id', data[0].id);
        console.log('Cleanup completed');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testSimpleLogoInsert();