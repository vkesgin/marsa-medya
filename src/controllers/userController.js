const supabase = require('../config/supabase')

// List users - accessible to all authenticated users for email mapping
exports.listUsers = async (req, res) => {
  try {
    const user = req.user || null
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    const isAdmin = userRole === 'admin' || isSuperAdmin

    // Try admin API if admin key is available
    const supabaseAdmin = require('../config/supabase').supabaseAdmin
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers()
        if (error) throw error
        const users = (data?.users || []).map(u => ({ 
          id: u.id, 
          email: u.email,
          role: isAdmin ? (u.user_metadata?.role || 'user') : undefined, // Only show role to admins
          isSuperAdmin: isSuperAdmin // Pass super admin status to frontend
        }))
        return res.json({ success: true, data: users, isSuperAdmin })
      } catch (e) {
        console.error('Admin API error:', e.message)
        // Fall through to alternative method
      }
    }

    // Alternative: fetch from contents table to get unique user emails
    // This at least shows who has been assigned content
    const { data: contents, error } = await supabase
      .from('contents')
      .select('assigned_to')
    
    if (error) throw error

    // Get unique assigned_to users - but we won't have emails
    const uniqueIds = [...new Set((contents || []).map(c => c.assigned_to).filter(Boolean))]
    
    // Return at least something - in a real app this should be a users table
    const users = uniqueIds.map((id, idx) => ({ 
      id, 
      email: `user-${idx + 1}@system.local`,
      role: 'user'
    }))
    
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Super Admin-only: Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = req.user || null
    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    
    if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Only super admin can delete users' })

    const { userId } = req.params
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' })

    // Cannot delete self
    if (user && user.id === userId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' })
    }

    const supabaseAdmin = require('../config/supabase').supabaseAdmin
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, message: 'Admin key not configured' })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Super Admin-only: Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const user = req.user || null
    const userRole = user?.user_metadata?.role
    const userEmail = user?.email
    const isSuperAdmin = userEmail === 'veli@marmosium.com' || userRole === 'super_admin'
    
    if (!isSuperAdmin) return res.status(403).json({ success: false, message: 'Only super admin can change roles' })

    const { userId } = req.params
    const { role } = req.body
    if (!userId || !role) return res.status(400).json({ success: false, message: 'User ID and role required' })
    
    // Validate role
    const validRoles = ['user', 'admin', 'approver', 'super_admin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be: user, admin, approver, or super_admin' })
    }

    const supabaseAdmin = require('../config/supabase').supabaseAdmin
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, message: 'Admin key not configured' })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role }
    })
    if (error) throw error

    res.json({ success: true, message: 'User role updated successfully' })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}
