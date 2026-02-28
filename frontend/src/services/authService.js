import { supabase } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Backend'deki /api/auth/login endpoint'i çağırarak kullanıcı girişi sağlar
 * Backend, Supabase Auth ile doğrulama yapıp token döndürür
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Giriş başarısız')
    }

    const data = await response.json()
    return data // { success, message, user, session, isAdmin }
  } catch (error) {
    throw error
  }
}

/**
 * Token'dan kullanıcı bilgilerini çeker (Supabase ile)
 * Backend'in auth middleware'i bunu yapıyor, ama frontend'de de gerekebilir
 */
export const getCurrentUser = async (token) => {
  try {
    if (!token) return null
    
    const { data, error } = await supabase.auth.getUser(token)
    if (error) throw error
    
    return data?.user || null
  } catch (error) {
    console.error('Kullanıcı bilgisi alınamadı:', error)
    return null
  }
}

/**
 * Yeni kullanıcı kayıt (optional - şu anda backend'de yoktur)
 */
export const registerUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

/**
 * Logout işlemi (token'ı localStorage'dan kaldırır)
 */
export const logoutUser = () => {
  localStorage.removeItem('sb_access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('isAdmin')
}

/**
 * Saklanan token'ı döndürür
 */
export const getStoredToken = () => {
  return localStorage.getItem('sb_access_token')
}

/**
 * Saklanan kullanıcı bilgilerini döndürür
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

/**
 * Admin midir kontrolü
 */
export const isAdmin = () => {
  return localStorage.getItem('isAdmin') === '1'
}
