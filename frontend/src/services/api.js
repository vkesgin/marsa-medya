import axios from 'axios'
import { showToast } from '../utils/toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000
})

// attach token on each request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sb_access_token')
  if(token){ config.headers = { ...config.headers, Authorization: `Bearer ${token}` } }
  return config
})

// global response handler: if we ever see 401 we assume the session has expired
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sb_access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('isAdmin')
      window.dispatchEvent(new Event('auth-changed'))
      showToast('Oturumunuz sona erdi, lütfen tekrar giriş yapın.', 'error', 3000)
    }
    return Promise.reject(error)
  }
)

export default api
