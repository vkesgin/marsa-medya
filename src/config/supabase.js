const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

// Client with publish key (for regular operations)
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for migrations (only if admin key provided)
const supabaseAdmin = supabaseAdminKey 
  ? createClient(supabaseUrl, supabaseAdminKey)
  : null;

module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;