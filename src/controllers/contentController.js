const supabase = require('../config/supabase');

// 1. Tüm İçerikleri Listeleme İşlemi
exports.getContents = async (req, res) => {
  try {
    const user = req.user || null
    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    const isAdmin = userRole === 'admin' || isSuperAdmin

    // Herkese tüm içerikleri döndür - frontend'de filtreleme yaparlar
    let query = supabase
      .from('contents')
      .select('*')
      .order('publish_date', { ascending: true })

    // Normal kullanıcılar için authentication gerekli
    if (!isAdmin && !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
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
    const user = req.user || null
    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    const isAdmin = userRole === 'admin' || isSuperAdmin
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' })

    const { company, publish_date, content_info, type, assigned_to } = req.body
    // varsayılan durum 'Planlandı' ve onay false (eğer approved column varsa)
    const payload = { company, publish_date, content_info, type, status: 'Planlandı' }
    // approved column varsa ekle
    try {
      payload.approved = false
    } catch (e) {
      // ignored if not supported
    }
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
    const { status, approved, drive_link, admin_approved, revision_notes, assigned_to } = req.body
    const user = req.user || null

    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    // fetch current content to check assigned_to
    const { data: existing, error: fetchErr } = await supabase.from('contents').select('*').eq('id', id).single()
    if (fetchErr) throw fetchErr

    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    const isAdmin = userRole === 'admin' || isSuperAdmin
    const isApprover = userRole === 'approver'
    const canApprove = isApprover || isSuperAdmin  // Only approver and super admin can approve, regular admin can only view
    const allowed = isAdmin || isApprover || (existing && existing.assigned_to === user.id)
    if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' })

    // only approver and super admin can modify admin_approved and revision_notes
    if ((admin_approved !== undefined || revision_notes !== undefined) && !canApprove) {
      return res.status(403).json({ success: false, message: 'Only approver and super admin can change approval/revision settings' })
    }

    // only super admin can modify assigned_to
    if (assigned_to !== undefined && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Only super admin can change assignment' })
    }

    // build payload dynamically
    const payload = {}
    if (status !== undefined) payload.status = status
    if (approved !== undefined) payload.approved = approved
    if (drive_link !== undefined) payload.drive_link = drive_link
    if (admin_approved !== undefined) payload.admin_approved = admin_approved
    if (revision_notes !== undefined) payload.revision_notes = revision_notes
    if (assigned_to !== undefined) payload.assigned_to = assigned_to
    
    const { data, error } = await supabase.from('contents').update(payload).eq('id', id).select()
    if (error) {
      // If some columns don't exist, try without them
      if (error.message?.includes('drive_link') && payload.drive_link !== undefined) {
        delete payload.drive_link
      }
      if (error.message?.includes('admin_approved') && payload.admin_approved !== undefined) {
        delete payload.admin_approved
      }
      if (error.message?.includes('revision_notes') && payload.revision_notes !== undefined) {
        delete payload.revision_notes
      }
      if (error.message?.includes('approved') && payload.approved !== undefined) {
        delete payload.approved
      }
      
      if (Object.keys(payload).length > 0) {
        const { data: retryData, error: retryError } = await supabase.from('contents').update(payload).eq('id', id).select()
        if (retryError) throw retryError
        return res.json({ success: true, data: retryData })
      }
      throw error
    }

    res.json({ success: true, data })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// 4. İçerik silme
exports.deleteContent = async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user || null

    if (!user) {
      console.log('Delete denied: No user authenticated')
      return res.status(401).json({ success: false, message: 'Unauthorized - No user authenticated' })
    }

    // fetch current content
    let existing
    try {
      const { data, error: fetchErr } = await supabase.from('contents').select('*').eq('id', id).single()
      if (fetchErr) {
        console.error('Delete fetch error:', fetchErr.message)
        throw fetchErr
      }
      existing = data
    } catch (fetchErr) {
      // Handle "no rows" error gracefully
      if (fetchErr.message?.includes('no rows')) {
        console.log(`Delete denied: Content ${id} not found`)
        return res.status(404).json({ success: false, message: 'Content not found' })
      }
      throw fetchErr
    }

    if (!existing) {
      console.log(`Delete denied: Content ${id} not found (null)`)
      return res.status(404).json({ success: false, message: 'Content not found' })
    }

    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    const isAdmin = userRole === 'admin' || isSuperAdmin
    
    console.log(`Delete check - ID: ${id}, User: ${user.id}, IsAdmin: ${isAdmin}, IsSuperAdmin: ${isSuperAdmin}`)
    
    if (!isAdmin) {
      console.log(`Delete denied: User ${user.id} is not admin`)
      return res.status(403).json({ success: false, message: 'Forbidden - Only admins can delete content' })
    }

    // delete - use admin client if available
    const supabaseAdmin = require('../config/supabase').supabaseAdmin
    const deleteClient = supabaseAdmin || supabase
    
    console.log(`Attempting to delete content ${id} using ${supabaseAdmin ? 'ADMIN' : 'regular'} client...`)
    const { error: deleteError, data: deleteData, status: deleteStatus } = await deleteClient.from('contents').delete().eq('id', id)
    
    if (deleteError) {
      console.error('Delete operation error:')
      console.error('  Message:', deleteError.message)
      console.error('  Code:', deleteError.code)
      console.error('  Details:', deleteError.details)
      console.error('  Hint:', deleteError.hint)
      console.error('  Full error:', deleteError)
      
      // Check if it's RLS related
      if (deleteError.message?.includes('check the RLS') || deleteError.code === 'PGRST301') {
        console.error('RLS POLICY BLOCKING DELETE - Check Supabase RLS settings')
        return res.status(403).json({ 
          success: false, 
          message: 'Silme yetkiniz yok (RLS policy). Admin kontrol etmelidir.' 
        })
      }
      
      throw deleteError
    }

    console.log(`Delete query executed with status ${deleteStatus}, now verifying...`)
    
    // Verify deletion - use same client
    const { data: checkData, error: checkError } = await deleteClient.from('contents').select('id').eq('id', id)
    
    if (checkError) {
      console.error('Verification query error:', checkError.message)
      // If it's "no rows" error, that means delete worked
      if (checkError.message?.includes('no rows')) {
        console.log(`✓ Content ${id} deleted successfully (no rows found in verification)`)
        res.json({ success: true, message: 'İçerik silindi', deleted_id: id })
        return
      }
    }
    
    if (checkData && checkData.length > 0) {
      console.error(`CRITICAL: Delete claimed success but content still exists! ID: ${id}`)
      console.error('Verification result:', checkData)
      return res.status(500).json({ success: false, message: 'Silme işlemi başarısız - içerik hâlâ var' })
    }

    console.log(`✓ Content ${id} deleted successfully and verified`)
    res.json({ success: true, message: 'İçerik silindi', deleted_id: id })
  } catch (error) {
    console.error('Delete endpoint error:', error.message, error)
    res.status(400).json({ success: false, message: error.message })
  }
}

// 5. İçerik yorumlarını listeleme
exports.getContentComments = async (req, res) => {
  try {
    const user = req.user || null
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { data, error } = await supabase
      .from('content_comments')
      .select('id, content_id, user_id, comment, created_at')
      .order('created_at', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// 6. İçeriğe yorum ekleme
exports.addContentComment = async (req, res) => {
  try {
    const user = req.user || null
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { id } = req.params
    const comment = String(req.body?.comment || '').trim()

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Yorum boş olamaz' })
    }

    if (comment.length > 1000) {
      return res.status(400).json({ success: false, message: 'Yorum en fazla 1000 karakter olabilir' })
    }

    const { data: contentExists, error: contentError } = await supabase
      .from('contents')
      .select('id')
      .eq('id', id)
      .single()

    if (contentError || !contentExists) {
      return res.status(404).json({ success: false, message: 'İçerik bulunamadı' })
    }

    const { data, error } = await supabase
      .from('content_comments')
      .insert([{ content_id: id, user_id: user.id, comment }])
      .select('id, content_id, user_id, comment, created_at')

    if (error) throw error

    res.status(201).json({ success: true, message: 'Yorum eklendi', data })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}