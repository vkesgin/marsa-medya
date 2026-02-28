import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { showToast } from '../utils/toast'

export default function Users(){
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  
  // note about Supabase dashboard users
  const [noteVisible] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // local message replaced by global toast
  // const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    try{
      const res = await api.get('/users')
      setUsers(res.data.data || [])
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

  const promoteToAdmin = async (userId, role = 'admin') => {
    try {
      const res = await api.patch(`/users/${userId}/role`, { role })
      showToast(res.data.message || (role === 'admin' ? 'Kullanıcı admin yapıldı' : 'Kullanıcı normal role döndürüldü'), 'success', 2000)
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
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
                <span className={`px-2 py-1 rounded text-sm ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </span>
              </td>
              <td className="px-2 py-2 flex gap-2">
                {u.role !== 'admin' ? (
                  <button onClick={()=>promoteToAdmin(u.id)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">
                    Admin Yap
                  </button>
                ) : (
                  <button onClick={()=>promoteToAdmin(u.id, 'user')} className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                    Normal Yap
                  </button>
                )}
                <button onClick={()=>deleteUser(u.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
