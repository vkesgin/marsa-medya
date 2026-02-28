const supabase = require('../config/supabase');

// 1. Tüm İçerikleri Listeleme İşlemi
exports.getContents = async (req, res) => {
  try {
    const user = req.user || null
    const isAdmin = user && process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

    // Eğer kullanıcı admin değilse, sadece kendisine atanan içerikleri getir
    let query = supabase
      .from('contents')
      .select('*')
      .order('publish_date', { ascending: true })

    if (!isAdmin) {
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })
      query = query.eq('assigned_to', user.id)
    }

    const { data, error } = await query

    if (error) throw error

    res.status(200).json({ success: true, data: data })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// 2. Yeni İçerik Ekleme İşlemi (Admin panelinden)
exports.createContent = async (req, res) => {
  try {
    const { company, publish_date, content_info, type, assigned_to } = req.body
    // varsayılan durum 'Planlandı' ve onay false
    const payload = { company, publish_date, content_info, type, status: 'Planlandı', approved: false }
    if (assigned_to) payload.assigned_to = assigned_to // optionally include

    const { data, error } = await supabase
      .from('contents')
      .insert([payload])
      .select()

    if (error) throw error

    res.status(201).json({ success: true, message: 'İçerik başarıyla planlandı!', data: data })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// 3. İçerik durumu güncelleme (status değişimi)
exports.updateContent = async (req, res) => {
  try {
    const { id } = req.params
    const { status, approved } = req.body
    const user = req.user || null

    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    // fetch current content to check assigned_to
    const { data: existing, error: fetchErr } = await supabase.from('contents').select('*').eq('id', id).single()
    if (fetchErr) throw fetchErr

    const isAdmin = user && process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
    const allowed = isAdmin || (existing && existing.assigned_to === user.id)
    if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' })

    // only admin can modify approval flag
    if (approved !== undefined && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admin can change approval' })
    }

    // build payload dynamically
    const payload = {}
    if (status !== undefined) payload.status = status
    if (approved !== undefined) payload.approved = approved
    const { data, error } = await supabase.from('contents').update(payload).eq('id', id).select()
    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}