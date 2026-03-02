import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ContentList from '../components/ContentList'
import ContentModal from '../components/ContentModal'
import DescriptionModal from '../components/DescriptionModal'
import Header from '../components/Header'
import { showToast } from '../utils/toast'

export default function Dashboard(){
  console.log('🔧 Dashboard component function called')
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [usersMap, setUsersMap] = useState({})
  const [filterStatus, setFilterStatus] = useState('Tümü')
  const [assignmentFilter, setAssignmentFilter] = useState(
    localStorage.getItem('isAdmin') === '1' || localStorage.getItem('isApprover') === '1' ? 'Tümü' : 'Bana Atananlar'
  )
  const [query, setQuery] = useState('')
  const [adminTab, setAdminTab] = useState('content')
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState('')
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [selectedRevision, setSelectedRevision] = useState('')
  const [linkEditingId, setLinkEditingId] = useState(null)
  const [linkEditingValue, setLinkEditingValue] = useState('')
  const [editingAssignedId, setEditingAssignedId] = useState(null)
  const [editingAssignedValue, setEditingAssignedValue] = useState('')
  const [revisionEditingId, setRevisionEditingId] = useState(null)
  const [revisionEditingValue, setRevisionEditingValue] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState({
    'Paylaşıldı': true,
    'İptal': true
  })

  const navigate = useNavigate()
  const location = useLocation()
  const mountedRef = React.useRef(true)
  const isAdmin = localStorage.getItem('isAdmin') === '1'
  const isApprover = localStorage.getItem('isApprover') === '1'
  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === '1'
  const currentUserId = JSON.parse(localStorage.getItem('user') || 'null')?.id

  const fetchUsersMap = async () => {
    try {
      const ures = await api.get('/users', { timeout: 5000 })
      if (!mountedRef.current) return
      const map = (ures.data.data || []).reduce((acc, user) => {
        acc[user.id] = user.email
        return acc
      }, {})
      setUsersMap(map)
    } catch {
      if (mountedRef.current) setUsersMap({})
    }
  }

  const fetchContents = async () => {
    if (mountedRef.current) setLoading(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      if (mountedRef.current) setLoading(false)
      return
    }

    try {
      console.log('=== FETCH CONTENTS START ===')
      const res = await api.get('/contents')
      console.log('Fetch response status:', res.status)
      console.log('Fetch response data count:', res.data.data?.length || 0)
      console.log('Fetch data:', res.data.data)
      
      if (!mountedRef.current) {
        console.log('Component unmounted, not updating state')
        return
      }
      
      setContents(res.data.data || [])
      console.log('Contents state updated with', res.data.data?.length || 0, 'items')

      if (mountedRef.current) setLoading(false)

      // Fetch users map for both admins and regular users
      fetchUsersMap()
    } catch (err) {
      if (!mountedRef.current) return
      console.error('=== FETCH CONTENTS ERROR ===')
      console.error('Status:', err.response?.status)
      console.error('Message:', err.response?.data?.message || err.message)
      
      if (err.response?.status === 401) {
        localStorage.removeItem('sb_access_token')
        localStorage.removeItem('user')
        localStorage.removeItem('isAdmin')
        navigate('/', { replace: true })
      } else {
        // Don't block UI - show empty list and brief error
        if (mountedRef.current) setContents([])
        const errMsg = err.code === 'ECONNABORTED' ? 'Sunucu yanıt vermiyor (timeout)' : (err.response?.data?.message || err.message || 'Veri yükleme hatası')
        showToast('⚠️ ' + errMsg, 'error', 2000)
      }
      if (mountedRef.current) setLoading(false)
    } finally {
      if (!mountedRef.current) return
    }
  }

  useEffect(() => {
    mountedRef.current = true
    fetchContents()
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, 'success', 2000)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const visibleContents = contents.filter((content) => {
    // Normal kullanıcılar için iptal ve paylaşıldı içerikleri filtrele
    if (!isAdmin) {
      if (content.status === 'İptal') return false
      if (content.status === 'Paylaşıldı') return false
    }
    
    // Assignment filter: "Bana Atananlar" seçiliyse sadece kendisine atananları göster (nur für normale User)
    if (!(isAdmin || isApprover) && assignmentFilter === 'Bana Atananlar' && content.assigned_to !== currentUserId) {
      return false
    }
    
    // Status filter
    if (filterStatus !== 'Tümü' && content.status !== filterStatus) return false
    
    // Search filter
    if (query) {
      const q = query.toLowerCase()
      return (content.company || '').toLowerCase().includes(q) || (content.content_info || '').toLowerCase().includes(q)
    }
    return true
  })

  // "Yapıldı" durumunda ve drive_link ile onaylanmayı bekleyen içerikler
  const pendingApprovals = contents.filter(c => 
    c.status === 'Yapıldı' && c.drive_link && !c.admin_approved
  )

  const approvedContents = contents.filter(c =>
    c.status === 'Yapıldı' && c.admin_approved
  )

  const assignmentSummary = Object.values(
    contents.reduce((acc, item) => {
      if (!item.assigned_to || item.status === 'İptal') return acc
      if (!acc[item.assigned_to]) {
        acc[item.assigned_to] = {
          userId: item.assigned_to,
          total: 0,
          post: 0,
          reels: 0,
          story: 0,
          other: 0
        }
      }

      const type = String(item.type || '').trim().toLowerCase()
      acc[item.assigned_to].total += 1

      if (type === 'post') acc[item.assigned_to].post += 1
      else if (type === 'reels') acc[item.assigned_to].reels += 1
      else if (type === 'story') acc[item.assigned_to].story += 1
      else acc[item.assigned_to].other += 1

      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  // Kategori fonksiyonu
  const groupContentsByStatus = (items) => {
    const grouped = {
      'Onaylananlar': items.filter(c => c.status === 'Yapıldı' && c.admin_approved).sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date)),
      'Revize Gerekli': items.filter(c => c.status === 'Revize Gerekli').sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date)),
      'Yapılıyor': items.filter(c => c.status === 'Yapılıyor').sort((a, b) => new Date(a.publish_date) - new Date(b.publish_date)),
      'Planlandı': items.filter(c => c.status === 'Planlandı').sort((a, b) => new Date(a.publish_date) - new Date(b.publish_date)),
      'Paylaşıldı': items.filter(c => c.status === 'Paylaşıldı').sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date)),
      'Beklemede': items.filter(c => c.status === 'Yapıldı' && !c.admin_approved).sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date)),
      'İptal': items.filter(c => c.status === 'İptal').sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date))
    }
    return Object.fromEntries(Object.entries(grouped).filter(([_, items]) => items.length > 0))
  }

  const statusColors = {
    'Planlandı': { bg: 'bg-yellow-50', border: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-900', badge: 'bg-yellow-100' },
    'Yapılıyor': { bg: 'bg-amber-50', border: 'border-amber-200 bg-amber-50', text: 'text-amber-900', badge: 'bg-amber-100' },
    'Paylaşıldı': { bg: 'bg-green-50', border: 'border-green-200 bg-green-50', text: 'text-green-900', badge: 'bg-green-100' },
    'Yapıldı': { bg: 'bg-purple-50', border: 'border-purple-200 bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-100' },
    'Revize Gerekli': { bg: 'bg-orange-50', border: 'border-orange-200 bg-orange-50', text: 'text-orange-900', badge: 'bg-orange-100' },
    'İptal': { bg: 'bg-red-50', border: 'border-red-200 bg-red-50', text: 'text-red-900', badge: 'bg-red-100' },
    'Onaylananlar': { bg: 'bg-purple-50', border: 'border-purple-200 bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-100' },
    'Beklemede': { bg: 'bg-gray-50', border: 'border-gray-200 bg-gray-50', text: 'text-gray-900', badge: 'bg-gray-100' }
  }

  const deleteContent = async (id) => {
    if (!window.confirm('Bu içeriği silmek istediğinize emin misiniz?')) return

    try {
      console.log('=== DELETE REQUEST ===')
      console.log('ID:', id)
      console.log('URL:', `/contents/${id}`)
      console.log('Token:', localStorage.getItem('sb_access_token')?.substring(0, 20) + '...')
      
      const res = await api.delete(`/contents/${id}`)
      console.log('Delete response status:', res.status)
      console.log('Delete response data:', res.data)
      showToast('İçerik silindi', 'success', 2000)
      fetchContents()
    } catch (err) {
      console.error('=== DELETE ERROR ===')
      console.error('Status:', err.response?.status)
      console.error('Data:', err.response?.data)
      console.error('Message:', err.message)
      showToast(err.response?.data?.message || err.message || 'Silme işlemi başarısız', 'error', 3000)
    }
  }

  const changeStatus = async (id, newStatus) => {
    try {
      await api.patch(`/contents/${id}`, { status: newStatus })
      // If status changed to "Yapıldı", open link editor
      if (newStatus === 'Yapıldı') {
        const item = contents.find(c => c.id === id)
        setLinkEditingId(id)
        setLinkEditingValue(item?.drive_link || '')
      }
      fetchContents()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const saveDriveLink = async (id, link) => {
    try {
      await api.patch(`/contents/${id}`, { drive_link: link })
      setLinkEditingId(null)
      setLinkEditingValue('')
      showToast('Link kaydedildi', 'success', 2000)
      fetchContents()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const saveRevisionNote = async (id, note) => {
    try {
      await api.patch(`/contents/${id}`, { revision_notes: note })
      setRevisionEditingId(null)
      setRevisionEditingValue('')
      showToast('Revize notu güncellendi', 'success', 2000)
      fetchContents()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const saveAssignedTo = async (id) => {
    try {
      await api.patch(`/contents/${id}`, { assigned_to: editingAssignedValue || null })
      setEditingAssignedId(null)
      setEditingAssignedValue('')
      showToast('Atanan kullanıcı güncellendi', 'success', 2000)
      fetchContents()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const canDeleteContent = (item) => {
    // Only admins can delete content
    return isAdmin
  }

  if (loading) return <div className="p-6 text-center">Yükleniyor...</div>

  return (
    <div className="p-6">
      <Header />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">İçerikler</h2>
        {isAdmin && <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={()=>setOpenModal(true)}>Yeni İçerik Ekle</button>}
      </div>

      {!(isAdmin || isApprover) && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-700">
            <strong>İçerikler:</strong> Tüm içerikleri görebilir veya sadece size atanan içerikleri filtreleyebilirsiniz.
          </p>
        </div>
      )}

      {(isAdmin || isApprover) && (
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setAdminTab('content')}
            className={`px-4 py-2 rounded ${adminTab === 'content' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            İçerik Yönetimi
          </button>
          <button 
            onClick={() => setAdminTab('approval')}
            className={`px-4 py-2 rounded ${adminTab === 'approval' ? 'bg-blue-600 text-white' : 'bg-gray-200'} relative`}
          >
            Onay Bekleyenler
            {pendingApprovals.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {adminTab === 'approval' ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Onay Bekleyen (Yapıldı)</h3>
          {pendingApprovals.length > 0 ? (
            <ContentList contents={pendingApprovals} usersMap={usersMap} currentUserId={currentUserId} onUpdated={fetchContents} />
          ) : (
            <p className="text-gray-500">Onay bekleyen içerik yok.</p>
          )}

          <h3 className="text-lg font-semibold mt-6 mb-4">Onaylanan (Yapıldı)</h3>
          {approvedContents.length > 0 ? (
            <ContentList contents={approvedContents} usersMap={usersMap} currentUserId={currentUserId} onUpdated={fetchContents} />
          ) : (
            <p className="text-gray-500">Onaylanan içerik yok.</p>
          )}
        </div>
      ) : (
        <div>
          {/* Revize Gerekli İçerikler Bildirimi */}
          {!isApprover && (() => {
            const myRevisions = contents.filter(c => 
              c.status === 'Revize Gerekli' && 
              c.assigned_to === currentUserId &&
              c.revision_notes
            )
            if (myRevisions.length > 0) {
              return (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 rounded">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">
                        Revize Edilmesi Gereken İçerikler ({myRevisions.length})
                      </h3>
                      <div className="space-y-2">
                        {myRevisions.map(item => (
                          <div key={item.id} className="bg-white p-3 rounded border border-orange-200">
                            <div className="font-semibold text-orange-900">{item.company}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {item.type} - 📅 {String(item.publish_date).split('T')[0]}
                            </div>
                            <div className="mt-2 p-2 bg-orange-100 rounded text-sm">
                              <strong>Admin Notu:</strong> {item.revision_notes}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          })()}

          {isSuperAdmin && (
            <div className="bg-indigo-50 border border-indigo-200 rounded p-4 mb-4">
              <h3 className="text-sm font-semibold text-indigo-900 mb-3">Atama Özeti (Süper Admin)</h3>
              {assignmentSummary.length > 0 ? (
                <div className="space-y-2">
                  {assignmentSummary.map((row) => {
                    const email = usersMap[row.userId] || row.userId
                    return (
                      <div key={row.userId} className="bg-white border border-indigo-100 rounded p-2 text-sm flex flex-wrap gap-3 items-center">
                        <span className="font-medium text-gray-800 min-w-[220px]">{email}</span>
                        <span className="text-gray-700">Toplam: {row.total}</span>
                        <span className="text-gray-700">Post: {row.post}</span>
                        <span className="text-gray-700">Reels: {row.reels}</span>
                        <span className="text-gray-700">Story: {row.story}</span>
                        {row.other > 0 && <span className="text-gray-700">Diğer: {row.other}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-indigo-800">Henüz kullanıcı ataması yapılmış aktif içerik yok.</p>
              )}
            </div>
          )}

          <div className="flex gap-3 mb-4 flex-wrap">
            {!isAdmin && !isApprover && (
              <select value={assignmentFilter} onChange={e=>setAssignmentFilter(e.target.value)} className="p-2 border rounded">
                <option>Tümü</option>
                <option>Bana Atananlar</option>
              </select>
            )}
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="p-2 border rounded">
              <option>Tümü</option>
              <option>Planlandı</option>
              <option>Yapılıyor</option>
              <option>Paylaşıldı</option>
              <option>Yapıldı</option>
              <option>Revize Gerekli</option>
              <option>İptal</option>
            </select>
            <input placeholder="Ara (şirket veya açıklama)" value={query} onChange={e=>setQuery(e.target.value)} className="p-2 border rounded flex-1 min-w-[200px]" />
            <button onClick={()=>{ setFilterStatus('Tümü'); setQuery(''); setAssignmentFilter('Tümü') }} className="px-3 py-1 border rounded hover:bg-gray-100">Sıfırla</button>
          </div>

          {loading ? (
            <p>Yükleniyor...</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupContentsByStatus(visibleContents)).map(([status, items]) => {
                const colors = statusColors[status] || statusColors['Planlandı']
                const statusLabelMap = {
                  'Planlandı': '📅 Planlandı',
                  'Yapılıyor': '⏳ Yapılıyor',
                  'Paylaşıldı': '✨ Paylaşıldı',
                  'Yapıldı': '✓ Yapıldı',
                  'Revize Gerekli': '⚠️ Revize Gerekli',
                  'İptal': '❌ İptal',
                  'Onaylananlar': '✓ Onaylananlar',
                  'Beklemede': '⏳ Onay Bekleyen'
                }
                
                // Paylaşıldı ve İptal kategorileri için collapsible yapı
                const isCollapsible = (isAdmin || isApprover) && (status === 'Paylaşıldı' || status === 'İptal')
                const isCollapsed = collapsedCategories[status]
                
                return (
                  <div key={status} className={`border rounded-lg p-4 ${colors.border}`}>
                    <div 
                      className={`flex justify-between items-center mb-3 ${isCollapsible ? 'cursor-pointer hover:opacity-75' : ''}`}
                      onClick={() => {
                        if (isCollapsible) {
                          setCollapsedCategories(prev => ({...prev, [status]: !prev[status]}))
                        }
                      }}
                    >
                      <h3 className={`text-lg font-semibold ${colors.text}`}>
                        {isCollapsible && (
                          <span className="mr-2 inline-block transition-transform" style={{transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'}}>▶</span>
                        )}
                        {statusLabelMap[status] || status}
                      </h3>
                    </div>
                    {(!isCollapsible || !isCollapsed) && (
                      <div className="grid gap-3">
                      {items.map(item => {
                        const assignedEmail = usersMap[item.assigned_to] || item.assigned_to || '—'
                        const canEdit = isAdmin || (currentUserId && item.assigned_to === currentUserId && item.status !== 'İptal')
                        const isCancelled = item.status === 'İptal'
                        return (
                          <div key={item.id} className="bg-white border rounded p-3 hover:shadow-md transition">
                            {isCancelled && (
                              <div className="mb-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded border border-red-300">
                                ⚠️ Bu içerik admin tarafından iptal edildi
                              </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="font-semibold text-lg">{item.company}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${colors.badge}`}>{item.type}</span>
                                  <span className="text-gray-500">📅 {String(item.publish_date).split('T')[0]}</span>
                                </div>
                                {canEdit && (
                                  <div className="mt-2">
                                    <select 
                                      value={item.status} 
                                      onChange={(e) => changeStatus(item.id, e.target.value)}
                                      className="p-1 border rounded text-xs bg-white"
                                    >
                                      <option>Planlandı</option>
                                      <option>Yapılıyor</option>
                                      <option>Paylaşıldı</option>
                                      <option>Yapıldı</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex flex-col items-end gap-2">
                                {isSuperAdmin && editingAssignedId === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <select
                                      value={editingAssignedValue}
                                      onChange={(e) => setEditingAssignedValue(e.target.value)}
                                      className="p-1 border rounded text-xs bg-white"
                                    >
                                      <option value="">Atanmamış</option>
                                      {Object.entries(usersMap).map(([userId, email]) => (
                                        <option key={userId} value={userId}>{email}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => saveAssignedTo(item.id)}
                                      className="text-green-600 hover:text-green-900 text-sm font-bold"
                                      title="Kaydet"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingAssignedId(null)
                                        setEditingAssignedValue('')
                                      }}
                                      className="text-red-600 hover:text-red-900 text-sm"
                                      title="İptal"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span>Atanan: {assignedEmail}</span>
                                    {isSuperAdmin && (
                                      <button
                                        onClick={() => {
                                          setEditingAssignedId(item.id)
                                          setEditingAssignedValue(item.assigned_to || '')
                                        }}
                                        className="text-gray-600 hover:text-gray-900 text-sm"
                                        title="Ata"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </div>
                                )}
                                {canDeleteContent(item) && (
                                  <button
                                    onClick={() => deleteContent(item.id)}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                    title="İçeriği sil"
                                  >
                                    🗑️ Sil
                                  </button>
                                )}
                              </div>
                            </div>
                            {item.content_info && (
                              <div className="text-sm bg-gray-50 p-2 rounded mb-2 border-l-2 border-gray-300">
                                <strong>Açıklama:</strong> 
                                <button
                                  onClick={() => {
                                    setSelectedDescription(item.content_info)
                                    setDescriptionModalOpen(true)
                                  }}
                                  className="text-blue-600 hover:underline cursor-pointer ml-1"
                                  title="Tam açıklamayı görmek için tıkla"
                                >
                                  {item.content_info.length > 60 ? item.content_info.substring(0, 60) + '...' : item.content_info}
                                </button>
                              </div>
                            )}
                            {(item.status === 'Revize Gerekli' || item.revision_notes) && (
                              <div className="text-sm bg-orange-50 p-2 rounded mb-2 border-l-2 border-orange-500">
                                {revisionEditingId === item.id ? (
                                  <div>
                                    <div className="font-semibold text-orange-700 mb-1">⚠️ Revize Notu:</div>
                                    <textarea
                                      value={revisionEditingValue}
                                      onChange={(e) => setRevisionEditingValue(e.target.value)}
                                      placeholder="Revize notunu buraya yazın..."
                                      className="w-full p-2 border rounded text-xs mb-2"
                                      rows="3"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => saveRevisionNote(item.id, revisionEditingValue)}
                                        className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                      >
                                        Kaydet
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRevisionEditingId(null)
                                          setRevisionEditingValue('')
                                        }}
                                        className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <strong className="text-orange-700">⚠️ Revize Notu:</strong>
                                        {item.revision_notes ? (
                                          <button
                                            onClick={() => {
                                              setSelectedRevision(item.revision_notes)
                                              setRevisionModalOpen(true)
                                            }}
                                            className="text-orange-900 hover:underline cursor-pointer ml-2 text-left"
                                            title="Tam revize notunu görmek için tıkla"
                                          >
                                            {item.revision_notes.length > 60 ? item.revision_notes.substring(0, 60) + '...' : item.revision_notes}
                                          </button>
                                        ) : (
                                          <span className="ml-2 text-orange-600 italic">(Henüz revize notu yazılmamış)</span>
                                        )}
                                      </div>
                                      {isAdmin && (
                                        <button
                                          onClick={() => {
                                            setRevisionEditingId(item.id)
                                            setRevisionEditingValue(item.revision_notes || '')
                                          }}
                                          className="ml-2 px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 whitespace-nowrap"
                                        >
                                          ✏️ Düzenle
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {item.drive_link && (
                              <div className="text-sm mb-2 p-2 bg-purple-100 rounded border border-purple-200">
                                {linkEditingId === item.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={linkEditingValue}
                                      onChange={(e) => setLinkEditingValue(e.target.value)}
                                      placeholder="https://..."
                                      className="flex-1 p-1 border rounded text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => saveDriveLink(item.id, linkEditingValue)}
                                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 whitespace-nowrap"
                                    >
                                      Kaydet
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLinkEditingId(null)
                                        setLinkEditingValue('')
                                      }}
                                      className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 whitespace-nowrap"
                                    >
                                      İptal
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <a href={item.drive_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                      📎 İçeriği Gör
                                    </a>
                                    <div className="flex gap-2">
                                      {canEdit && (
                                        <button
                                          onClick={() => {
                                            setLinkEditingId(item.id)
                                            setLinkEditingValue(item.drive_link)
                                          }}
                                          className="text-xs text-blue-600 hover:underline"
                                        >
                                          ✏️ Düzenle
                                        </button>
                                      )}
                                      {item.admin_approved && <span className="text-green-600 text-xs font-semibold">✓ Onaylı</span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {!item.drive_link && (item.status === 'Yapıldı' || item.status === 'Revize Gerekli') && (
                              <div className="text-sm mb-2 p-2 bg-purple-100 rounded border border-purple-200">
                                {linkEditingId === item.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={linkEditingValue}
                                      onChange={(e) => setLinkEditingValue(e.target.value)}
                                      placeholder="https://..."
                                      className="flex-1 p-1 border rounded text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => saveDriveLink(item.id, linkEditingValue)}
                                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 whitespace-nowrap"
                                    >
                                      Kaydet
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLinkEditingId(null)
                                        setLinkEditingValue('')
                                      }}
                                      className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 whitespace-nowrap"
                                    >
                                      İptal
                                    </button>
                                  </div>
                                ) : canEdit ? (
                                  <button
                                    onClick={() => {
                                      setLinkEditingId(item.id)
                                      setLinkEditingValue('')
                                    }}
                                    className="text-blue-600 hover:underline text-xs font-medium"
                                  >
                                    + Link Ekle
                                  </button>
                                ) : (
                                  <span className="text-gray-500 text-xs">Link bekleniyor...</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <DescriptionModal 
        open={descriptionModalOpen}
        description={selectedDescription}
        onClose={() => setDescriptionModalOpen(false)}
      />

      <DescriptionModal 
        open={revisionModalOpen}
        description={selectedRevision}
        onClose={() => setRevisionModalOpen(false)}
      />

      <ContentModal open={openModal} onClose={()=>setOpenModal(false)} onCreated={()=>{setOpenModal(false); fetchContents();}} />
    </div>
  )
}
