import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Users(){
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    try{
      const res = await api.get('/users')
      setUsers(res.data.data || [])
    }catch(err){
      alert(err.response?.data?.message || err.message)
    }
  }

  useEffect(()=>{ fetchUsers() }, [])

  const addUser = async (e) => {
    e.preventDefault()
    if(!email || !password) return setMessage('Email ve parola giriniz')
    setLoading(true)
    try{
      const res = await api.post('/auth/register', { email, password })
      setMessage(res.data.message || 'Kullanıcı eklendi')
      setEmail(''); setPassword('')
      fetchUsers()
    }catch(err){
      setMessage(err.response?.data?.message || err.message)
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Kullanıcı Yönetimi</h2>
      <form onSubmit={addUser} className="mb-6 max-w-md">
        {message && <p className="mb-2 text-sm text-blue-700">{message}</p>}
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
          <tr className="text-left border-b">
            <th className="px-2 py-2">Email</th>
            <th className="px-2 py-2">ID</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u=> (
            <tr key={u.id} className="border-b">
              <td className="px-2 py-2">{u.email}</td>
              <td className="px-2 py-2 text-sm text-gray-600 break-all">{u.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
