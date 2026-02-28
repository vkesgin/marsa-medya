import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'

export default function App(){
  const isAuth = !!localStorage.getItem('sb_access_token')

  return (
    <Routes>
      <Route path="/" element={isAuth ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/users" element={isAuth && localStorage.getItem('isAdmin')==='1' ? <Users /> : <Navigate to="/" />} />
    </Routes>
  )
}
