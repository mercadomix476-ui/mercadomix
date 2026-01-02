// Debug script to test logo upload directly
// You can run this in the browser console to test the upload

async function debugLogoUpload() {
  console.log('Starting logo upload debug...');
  
  // Test 1: Check if supabase is available
  console.log('1. Checking Supabase connection...');
  try {
    const { data: user } = await supabase.auth.getUser();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Supabase auth error:', error);
    return;
  }

  // Test 2: Check if store_logos table exists
  console.log('2. Checking store_logos table...');
  try {
    const { data, error } = await supabase
      .from('store_logos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Table query error:', error);
    } else {
      console.log('Table exists, sample data:', data);
    }
  } catch (error) {
    console.error('Table check error:', error);
  }

  // Test 3: Try a simple insert
  console.log('3. Testing simple insert...');
  try {
    const { data, error } = await supabase
      .from('store_logos')
      .insert([{
        store_id: 'default-store',
        logo_url: 'test-debug-url',
        original_filename: 'debug-test.jpg',
        file_size: 1000,
        mime_type: 'image/jpeg',
        is_active: false // Set to false so it doesn't interfere
      }])
      .select();

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert successful:', data);
      
      // Clean up
      await supabase
        .from('store_logos')
        .delete()
        .eq('logo_url', 'test-debug-url');
      console.log('Cleanup completed');
    }
  } catch (error) {
    console.error('Insert test error:', error);
  }

  // Test 4: Check storage bucket
  console.log('4. Checking storage bucket...');
  try {
    const { data, error } = await supabase.storage
      .from('store-logos')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('Storage bucket error:', error);
    } else {
      console.log('Storage bucket accessible:', data);
    }
  } catch (error) {
    console.error('Storage check error:', error);
  }

  console.log('Debug completed. Check the console for results.');
}

// Instructions:
// 1. Open browser console on your app
// 2. Paste this entire script
// 3. Run: debugLogoUpload()
// 4. Check the console output for errors