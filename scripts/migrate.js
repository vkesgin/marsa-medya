require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !supabaseAdminKey) {
  console.error('SUPABASE_URL or SUPABASE_ADMIN_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function migrate() {
  try {
    console.log('Adding drive_link and admin_approved columns to contents table...');
    
    // Check if columns exist and add them if they don't
    const { data, error: selectError } = await supabase
      .from('contents')
      .select('drive_link, admin_approved')
      .limit(0);

    if (selectError && selectError.message?.includes('drive_link')) {
      console.log('drive_link column not found, adding it...');
      // We can't directly create columns via JavaScript SDK, so we'll note this
      console.log('⚠️  You need to add these columns to your Supabase table:');
      console.log('   - drive_link (TEXT, nullable)');
      console.log('   - admin_approved (BOOLEAN, default false)');
      console.log('');
      console.log('Go to your Supabase project > SQL Editor and run:');
      console.log('');
      console.log('ALTER TABLE contents ADD COLUMN drive_link TEXT DEFAULT NULL;');
      console.log('ALTER TABLE contents ADD COLUMN admin_approved BOOLEAN DEFAULT false;');
      console.log('');
      process.exit(1);
    }

    console.log('✓ Columns already exist or have been added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

migrate();
