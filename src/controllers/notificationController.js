const supabase = require('../config/supabase')

exports.listNotifications = async (req, res) => {
  try {
    const user = req.user || null
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, content_id, type, title, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const unreadCount = (data || []).filter(item => !item.is_read).length
    res.json({ success: true, data: data || [], unreadCount })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.markNotificationRead = async (req, res) => {
  try {
    const user = req.user || null
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { id } = req.params

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, is_read')

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const user = req.user || null
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    res.json({ success: true, message: 'Tüm bildirimler okundu olarak işaretlendi' })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}
