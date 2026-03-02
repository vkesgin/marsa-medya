import React, { useState } from 'react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { showToast } from '../utils/toast'
import { authService } from '../services/authService'

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Tüm alanlar gereklidir', 'error', 3000)
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Yeni parolalar eşleşmiyor', 'error', 3000)
      return
    }

    if (newPassword.length < 6) {
      showToast('Parola en az 6 karakter olmalı', 'error', 3000)
      return
    }

    setLoading(true)
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword
      })

      if (response.success) {
        showToast('Parola başarıyla güncellendi', 'success', 3000)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showToast(response.message || 'Parola güncellenemedi', 'error', 3000)
      }
    } catch (error) {
      showToast(error.message || 'Bir hata oluştu', 'error', 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Header />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">Profil</h2>
        <p className="text-gray-600 mb-6">Email: <strong>{user?.email}</strong></p>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">Parola Değiştir</h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mevcut Parola
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mevcut parolanızı girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yeni Parola
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yeni parola girin"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Güncelleniyor...' : 'Parola Değiştir'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
