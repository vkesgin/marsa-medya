const supabase = require('../config/supabase')

// Admin-only: Supabase'den kullanıcı listesini döndürür
exports.listUsers = async (req, res) => {
  try {
    const user = req.user || null
    const isAdmin = user && process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' })

    // Try to list users via admin API (requires service_role key)
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    // Map to minimal info
    const users = (data?.users || []).map(u => ({ id: u.id, email: u.email }))
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
