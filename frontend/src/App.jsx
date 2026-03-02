import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Companies from './pages/Companies'
import Toast from './components/Toast'

export default function App(){
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('sb_access_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuth(!!localStorage.getItem('sb_access_token'))
    }

    // Debug: Log auth state
    console.log('Auth state:', isAuth, 'Token:', localStorage.getItem('sb_access_token'))
    setLoading(false)

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('auth-changed', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('auth-changed', syncAuthState)
    }
  }, [])

  if (loading) return <div style={{padding: '20px'}}>Loading...</div>
  if (!isAuth) return <Login onLoginSuccess={() => setIsAuth(true)} />

  return (
    <>
      <Toast />
      <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={localStorage.getItem('isAdmin')==='1' ? <Users /> : <Navigate to="/" />} />
      <Route path="/companies" element={localStorage.getItem('isAdmin')==='1' ? <Companies /> : <Navigate to="/" />} />
      </Routes>
    </>
  )
}
