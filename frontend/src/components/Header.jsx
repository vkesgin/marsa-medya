import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header(){
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const email = user?.email || 'Anon'

  const logout = ()=>{
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    navigate('/')
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold">İçerik Planlama</h1>
        <p className="text-sm text-gray-600">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        {localStorage.getItem('isAdmin') === '1' && (
          <button onClick={()=>navigate('/users')} className="px-3 py-1 bg-indigo-600 text-white rounded">Kullanıcılar</button>
        )}
        <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded">Çıkış</button>
      </div>
    </div>
  )
}
