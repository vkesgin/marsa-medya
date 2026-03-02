import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
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
      <Route
        path="/"
        element={isAuth ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={() => setIsAuth(true)} />}
      />
      <Route
        path="/dashboard"
        element={isAuth ? <Dashboard /> : <Navigate to="/" />}
      />
      <Route
        path="/profile"
        element={isAuth ? <Profile /> : <Navigate to="/" />}
      />
      <Route
        path="/users"
        element={isAuth && localStorage.getItem('isAdmin')==='1' ? <Users /> : <Navigate to="/" />}
      />
      <Route
        path="/companies"
        element={isAuth && localStorage.getItem('isAdmin')==='1' ? <Companies /> : <Navigate to="/" />}
      />
>>>>>>> dev
      </Routes>
    </>
  )
}
