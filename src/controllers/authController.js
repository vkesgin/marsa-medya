const supabase = require('../config/supabase');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Supabase Auth ile giriş yapıyoruz
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Admin kontrolü: user_metadata'dan role'ü kontrol et
    const userRole = data?.user?.user_metadata?.role;
    const userEmail = data?.user?.email;
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin';
    const isAdmin = userRole === 'admin' || isSuperAdmin;
    const isApprover = userRole === 'approver';
    
    // Debug logging
    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', userEmail);
    console.log('Role from metadata:', userRole);
    console.log('isSuperAdmin:', isSuperAdmin);
    console.log('isAdmin:', isAdmin);
    console.log('isApprover:', isApprover);
    console.log('==================');
    
    res.status(200).json({
      success: true,
      message: "Giriş başarılı!",
      user: data.user, // Kullanıcı bilgileri (id, email vb.)
      session: data.session.access_token, // Bu token ile sonraki işlemlerde kimliğimizi kanıtlayacağız
      isAdmin: !!isAdmin,
      isSuperAdmin: !!isSuperAdmin,
      isApprover: !!isApprover
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// admin için kullanıcı oluşturma
exports.registerUser = async (req, res) => {
  try {
    const user = req.user || null
    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    const isAdmin = userRole === 'admin' || isSuperAdmin
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' })

    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email ve parola gereklidir' })

    // Use admin client for user creation
    const supabaseAdmin = require('../config/supabase').supabaseAdmin
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, message: 'Admin key not configured' })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (error) throw error

    res.status(201).json({ success: true, message: 'Kullanıcı oluşturuldu', data })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
};