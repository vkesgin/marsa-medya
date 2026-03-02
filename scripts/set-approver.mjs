import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

async function setApprover() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Kullanım: node scripts/set-approver.mjs <email>');
    console.log('Örnek: node scripts/set-approver.mjs approver@example.com');
    process.exit(1);
  }
  
  try {
    console.log(`Approver rolü ayarlanıyor: ${email}`);
    
    // Kullanıcıyı bul
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Kullanıcılar listelenirken hata:', listError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`❌ ${email} kullanıcısı bulunamadı.`);
      console.log('Önce bu email ile bir kullanıcı oluşturmalısınız.');
      return;
    }
    
    console.log('Bulunan kullanıcı:', user.email, 'ID:', user.id);
    
    // User metadata'yı güncelle
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: 'approver'
        }
      }
    );
    
    if (updateError) {
      console.error('Kullanıcı güncellenirken hata:', updateError);
      return;
    }
    
    console.log('✅ Approver rolü başarıyla ayarlandı!');
    console.log(`${email} artık sadece içerikleri görüp onay verebilir, içerik ekleyemez.`);
    
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
  }
}

setApprover();
