import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'
import api from '../services/api'

export default function Header(){
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const prevUnreadCountRef = useRef(0)
  const initializedFetchRef = useRef(false)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const email = user?.email || 'Anon'
  const isAdmin = localStorage.getItem('isAdmin') === '1'
  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === '1'
  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')

  const unreadCount = useMemo(
    () => notifications.filter(item => !item.is_read).length,
    [notifications]
  )

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      const newNotifications = res.data.data || []
      const newUnreadCount = newNotifications.filter(item => !item.is_read).length

      // İlk fetch'te sadece baseline al; sonraki fetch'lerde yeni gelenleri bildir
      if (initializedFetchRef.current && newUnreadCount > prevUnreadCountRef.current) {
        const latestUnread = newNotifications.filter(item => !item.is_read)[0]
        if (latestUnread) {
          console.log('🔔 Yeni bildirim:', latestUnread.title, '| Browser enabled:', browserNotificationsEnabled, '| Permission:', Notification?.permission)
          
          // Tarayıcı bildirimi göster
          if (browserNotificationsEnabled) {
            showBrowserNotification(latestUnread.title, latestUnread.message)
          }
          
          // Dashboard'ı otomatik yenile
          window.dispatchEvent(new CustomEvent('new-notification', { detail: latestUnread }))
        }
      }

      initializedFetchRef.current = true
      prevUnreadCountRef.current = newUnreadCount
      setNotifications(newNotifications)
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Notification fetch error:', err.response?.data?.message || err.message)
      }
    }
  }

  const showBrowserNotification = (title, message) => {
    console.log('📢 showBrowserNotification çağrıldı:', { title, message, hasNotification: 'Notification' in window, permission: Notification?.permission })
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'marsa-medya-notification',
          requireInteraction: false
        })
        
        console.log('✅ Tarayıcı bildirimi oluşturuldu')
        
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error('❌ Tarayıcı bildirimi hatası:', error)
      }
    } else {
      console.warn('⚠️ Tarayıcı bildirimi gösterilemedi - izin:', Notification?.permission)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Bu tarayıcı bildirim desteklemiyor', 'error', 2000)
      console.warn('Bu tarayıcı bildirim desteklemiyor')
      return
    }

    if (Notification.permission === 'denied') {
      setNotificationPermission('denied')
      showToast('Tarayıcı bildirimi engelli. Site ayarlarından izin verin.', 'error', 2500)
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted')
      setBrowserNotificationsEnabled(true)
      showToast('Tarayıcı bildirimleri zaten açık', 'success', 1500)
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    if (permission === 'granted') {
      setBrowserNotificationsEnabled(true)
      showToast('Tarayıcı bildirimleri açıldı', 'success', 2000)
    } else {
      setBrowserNotificationsEnabled(false)
      showToast('Bildirim izni verilmedi', 'error', 2000)
    }
  }

  useEffect(() => {
    if ('Notification' in window) {
      const perm = Notification.permission || 'default'
      setNotificationPermission(perm)
      setBrowserNotificationsEnabled(perm === 'granted')
    }
    fetchNotifications()
    const intervalId = setInterval(fetchNotifications, 20000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const onDocClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const markOneRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(item => item.id === notificationId ? { ...item, is_read: true } : item))
    } catch (err) {
      showToast(err.response?.data?.message || 'Bildirim güncellenemedi', 'error', 1500)
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })))
    } catch (err) {
      showToast(err.response?.data?.message || 'Bildirimler güncellenemedi', 'error', 1500)
    }
  }

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
      <div className="flex items-center gap-2 flex-wrap relative" ref={panelRef}>
        <button
          onClick={() => setNotificationsOpen(prev => !prev)}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 relative"
          title="Bildirimler"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full min-w-5 h-5 px-1 text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600"
            title="Tarayıcı bildirim izni"
          >
            🔔 İzin Ver
          </button>
        )}

        {notificationsOpen && (
          <div className="absolute right-0 top-10 w-96 max-h-96 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-sm">Bildirimler</h3>
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Tümünü okundu yap</button>
            </div>
            <div className="p-2 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">Henüz bildiriminiz yok.</p>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    className={`p-2 rounded border text-xs ${item.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{item.title}</div>
                        <div className="text-gray-700 mt-1">{item.message}</div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {new Date(item.created_at).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      {!item.is_read && (
                        <button
                          onClick={() => markOneRead(item.id)}
                          className="text-[11px] text-blue-600 hover:underline whitespace-nowrap"
                        >
                          Okundu
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
