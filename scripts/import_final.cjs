const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is not defined. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 100;

async function main() {
  const csvPath = path.resolve(__dirname, '../produtos_import3.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    return;
  }

  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.trim().split('\n');
  
  const header = lines[0].toLowerCase();
  if (header.includes('nome') || header.includes('preço') || header.includes('barra')) {
      lines.shift();
      console.log('CSV header detected and skipped.');
  }

  const products = lines.map(line => {
    const parts = line.split(/[;,]/).map(p => p.trim().replace(/"/g, ''));
    if (parts.length < 3) {
      console.warn(`Skipping malformed line: ${line}`);
      return null;
    }
    
    const [name, barcode, sale_price_str] = parts;
    
    if (!name || !barcode) {
        console.warn(`Skipping line with empty name or barcode: ${line}`);
        return null;
    }

    const cleaned_price_str = sale_price_str ? sale_price_str.replace(/R\$/g, '').replace(',', '.') : '0';
    const sale_price = parseFloat(cleaned_price_str);

    if (isNaN(sale_price)) {
        console.warn(`Skipping line with invalid sale price: ${line}`);
        return null;
    }

    return {
      name: name.trim(),
      barcode: barcode.trim(),
      sale_price,
      cost_price: 0, // Default cost price to 0 as it is not in the file
      stock_quantity: 100, // Default stock
      unit_type: 'unidade', // Default unit type
    };
  }).filter(p => p && p.barcode);

  if (products.length === 0) {
    console.log('No valid products found in the CSV file to process.');
    return;
  }

  console.log(`Found ${products.length} valid products in CSV file.`);

  try {
    console.log('Since the database is empty, proceeding with direct insertion.');

    let insertedCount = 0;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(products.length / BATCH_SIZE)}...`);
      
      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`Error inserting batch:`, error);
        break; 
      }
      
      if (data) {
          insertedCount += data.length;
      }
    }

    console.log('--- Import Summary ---');
    console.log(`Total products in CSV: ${products.length}`);
    console.log(`Successfully inserted: ${insertedCount} products.`);
    if (insertedCount < products.length) {
        console.warn('Some products may not have been inserted due to errors.');
    }
    console.log('----------------------');

  } catch (error) {
    console.error('An unexpected error occurred during the import process:', error);
  }
}

main();
