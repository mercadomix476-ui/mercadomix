const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is not defined. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllProducts() {
  console.log('Starting the process to delete ALL products from the database...');

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .gte('id', 0); // This condition targets all rows since IDs are positive

    if (error) {
      console.error('An error occurred while deleting the products:', error);
      return;
    }

    console.log('--- Cleanup Complete ---\nAll products have been successfully deleted.');

  } catch (error) {
    console.error('An unexpected error occurred during the cleanup process:', error);
  }
}

clearAllProducts();
