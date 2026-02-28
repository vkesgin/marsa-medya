require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !supabaseAdminKey) {
  console.error('SUPABASE_URL or SUPABASE_ADMIN_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function setAdminRole(email) {
  try {
    // Get user by email
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const user = data.users.find(u => u.email === email);
    if (!user) {
      console.error(`User ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.id} (${user.email})`);
    console.log(`Current metadata:`, user.user_metadata);

    // Update user metadata with admin role
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        role: 'admin'
      }
    });

    if (updateError) throw updateError;
    console.log(`✓ User ${email} set as admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2] || 'test@example.com';
console.log(`Setting ${email} as admin...`);
setAdminRole(email);
