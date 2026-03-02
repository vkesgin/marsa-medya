import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { showToast } from '../utils/toast'
import { authService } from '../services/authService'

export default function Users(){
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  // note about Supabase dashboard users
  const [noteVisible] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const fetchUsers = async () => {
    try{
      const res = await api.get('/users')
      setUsers(res.data.data || [])
      setIsSuperAdmin(res.data.isSuperAdmin || false)
    }catch(err){
      if (err.response?.status !== 401) {
        showToast(err.response?.data?.message || err.message, 'error', 3000)
      }
      // if 401, global interceptor already redirected to login
    }
  }

  useEffect(()=>{ fetchUsers() }, [])

  const addUser = async (e) => {
    e.preventDefault()
    if(!email || !password) return setMessage('Email ve parola giriniz')
    setLoading(true)
    try{
      const res = await api.post('/auth/register', { email, password })
      showToast(res.data.message || 'Kullanıcı eklendi', 'success', 2000)
      setEmail(''); setPassword('')
      fetchUsers()
    }catch(err){
      if (err.response?.status === 401) {
        // not expected while adding user, but interceptor will redirect
      } else {
        showToast(err.response?.data?.message || err.message, 'error', 3000)
      }
    }finally{ setLoading(false) }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return
    try {
      const res = await api.delete(`/users/${userId}`)
      showToast(res.data.message || 'Kullanıcı silindi', 'success', 2000)
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const changeUserRole = async (userId, newRole) => {
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: newRole })
      showToast(res.data.message || 'Kullanıcı rolü güncellendi', 'success', 2000)
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const handleChangeUserPassword = async (e) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      showToast('Parola alanları gereklidir', 'error', 3000)
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Parolalar eşleşmiyor', 'error', 3000)
      return
    }

    if (newPassword.length < 6) {
      showToast('Parola en az 6 karakter olmalı', 'error', 3000)
      return
    }

    setPasswordLoading(true)
    try {
      const response = await authService.changeUserPassword(selectedUser.id, newPassword)
      showToast(response.message || 'Parola başarıyla güncellendi', 'success', 2000)
      setShowPasswordModal(false)
      setSelectedUser(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      showToast(error.message || 'Parola güncellenemedi', 'error', 3000)
    } finally {
      setPasswordLoading(false)
    }
  }
  
  const getRoleLabel = (role) => {
    const roleMap = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'approver': 'Onaylayıcı',
      'user': 'Kullanıcı'
    }
    return roleMap[role] || 'Kullanıcı'
  }
  
  const getRoleColor = (role) => {
    const colorMap = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-yellow-100 text-yellow-800',
      'approver': 'bg-green-100 text-green-800',
      'user': 'bg-blue-100 text-blue-800'
    }
    return colorMap[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Kullanıcı Yönetimi</h2>
        <button onClick={()=>navigate('/dashboard')} className="px-3 py-1 bg-gray-500 text-white rounded">Geri</button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        * Supabase panelinden eklenen kullanıcıların parolası olmuyor; giriş yapabilmeleri için bu formu kullanın.
      </p>
      <form onSubmit={addUser} className="mb-6 max-w-md">
        {/* messages shown via global toast */}
        <div className="mb-2">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-2">
          <input type="password" placeholder="Parola" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <button className="px-3 py-1 bg-green-600 text-white rounded" disabled={loading}>{loading? 'Ekle...' : 'Kullanıcı Ekle'}</button>
      </form>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left border-b bg-gray-100">
            <th className="px-2 py-2">Email</th>
            <th className="px-2 py-2">Rol</th>
            <th className="px-2 py-2">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u=> (
            <tr key={u.id} className="border-b">
              <td className="px-2 py-2">{u.email}</td>
              <td className="px-2 py-2">
                {isSuperAdmin ? (
                  <select 
                    value={u.role || 'user'} 
                    onChange={(e) => changeUserRole(u.id, e.target.value)}
                    className={`px-2 py-1 rounded text-sm border ${getRoleColor(u.role)}`}
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="approver">Onaylayıcı</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-sm ${getRoleColor(u.role)}`}>
                    {getRoleLabel(u.role)}
                  </span>
                )}
              </td>
              <td className="px-2 py-2 flex gap-2">
                {isSuperAdmin && (
                  <>
                    <button 
                      onClick={() => {
                        setSelectedUser(u)
                        setShowPasswordModal(true)
                        setNewPassword('')
                        setConfirmPassword('')
                      }} 
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Parola
                    </button>
                    <button onClick={()=>deleteUser(u.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                      Sil
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Parola Değiştir</h3>
            <p className="text-sm text-gray-600 mb-4">
              Kullanıcı: <strong>{selectedUser.email}</strong>
            </p>
            
            <form onSubmit={handleChangeUserPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Parola
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Yeni parola"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parola Onayla
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Parolayı tekrar girin"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {passwordLoading ? 'Güncelleniyor...' : 'Parola Değiştir'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setSelectedUser(null)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
