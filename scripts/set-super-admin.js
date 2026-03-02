require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ADMIN_KEY; // Changed from SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_ADMIN_KEY gerekli!');
  console.error('Lütfen .env dosyanızda SUPABASE_ADMIN_KEY değişkenini ayarlayın.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setSuperAdmin() {
  const email = 'veli@marmosium.com';
  
  try {
    // Kullanıcıyı email'e göre bul
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log(`❌ ${email} kullanıcısı bulunamadı!`);
      console.log('Önce bu kullanıcıyı oluşturmalısınız.');
      return;
    }
    
    // Super admin olarak işaretle
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        user_metadata: { role: 'super_admin' }
      }
    );
    
    if (error) throw error;
    
    console.log('✅ Super admin başarıyla ayarlandı!');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`👑 Role: super_admin`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

setSuperAdmin();
