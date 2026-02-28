import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Companies from './pages/Companies'
import Toast from './components/Toast'

export default function App(){
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('sb_access_token'))

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuth(!!localStorage.getItem('sb_access_token'))
    }

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('auth-changed', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('auth-changed', syncAuthState)
    }
  }, [])

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
        path="/users"
        element={isAuth && localStorage.getItem('isAdmin')==='1' ? <Users /> : <Navigate to="/" />}
      />
      <Route
        path="/companies"
        element={isAuth && localStorage.getItem('isAdmin')==='1' ? <Companies /> : <Navigate to="/" />}
      />
      </Routes>
    </>
  )
}

