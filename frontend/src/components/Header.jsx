import React from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'

export default function Header(){
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const email = user?.email || 'Anon'
  const isAdmin = localStorage.getItem('isAdmin') === '1'
  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === '1'

  const logout = ()=>{
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('isSuperAdmin')
    localStorage.removeItem('isApprover')
    window.dispatchEvent(new Event('auth-changed'))
    showToast('Oturum kapatıldı.', 'success', 2000)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold">MarsaMedya</h1>
        <p className="text-sm text-gray-600">{email}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={()=>navigate('/profile')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Profil</button>
        {isSuperAdmin && (
          <button onClick={()=>navigate('/users')} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Kullanıcılar</button>
        )}
        {isAdmin && (
          <button onClick={()=>navigate('/companies')} className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700">Şirketler</button>
        )}
        <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Çıkış</button>
      </div>
    </div>
  )
}
