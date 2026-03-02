import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

async function deleteTestUser() {
  try {
    console.log('Test kullanıcısı siliniyor...');
    
    // test@example.com kullanıcısını bul
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Kullanıcılar listelenirken hata:', listError);
      return;
    }
    
    const testUser = users.users.find(user => user.email === 'test@example.com');
    
    if (!testUser) {
      console.log('test@example.com kullanıcısı bulunamadı.');
      return;
    }
    
    console.log('Bulunan kullanıcı:', testUser.email, 'ID:', testUser.id);
    
    // Kullanıcıyı sil
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);
    
    if (deleteError) {
      console.error('Kullanıcı silinirken hata:', deleteError);
      return;
    }
    
    console.log('✅ test@example.com kullanıcısı başarıyla silindi!');
    
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
  }
}

deleteTestUser();
