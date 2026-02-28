import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App(){
  const isAuth = !!localStorage.getItem('sb_access_token')

  return (
    <Routes>
      <Route path="/" element={isAuth ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/" />} />
    </Routes>
  )
}
