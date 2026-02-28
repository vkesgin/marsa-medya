import React, { useState } from 'react'
import api from '../services/api'
import DescriptionModal from './DescriptionModal'
import AdminApprovalModal from './AdminApprovalModal'

const statusClasses = {
  'Planlandı': 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  'Yapılıyor': 'bg-amber-50 text-amber-800 border border-amber-200',
  'Paylaşıldı': 'bg-green-50 text-green-800 border border-green-200',
  'Yapıldı': 'bg-purple-50 text-purple-800 border border-purple-200',
  'Revize Gerekli': 'bg-orange-50 text-orange-800 border border-orange-200',
  'İptal': 'bg-red-50 text-red-800 border border-red-200'
}

export default function ContentList({ contents = [], usersMap = {}, currentUserId = null, onUpdated = ()=>{} }){
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState('')
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [editingLinkValue, setEditingLinkValue] = useState('')
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [revisionContentId, setRevisionContentId] = useState(null)
  const [revisionContentName, setRevisionContentName] = useState('')
  const isAdmin = localStorage.getItem('isAdmin') === '1'
  
  const formatDate = (value) => {
    if (!value) return '-'
    const parsed = String(value).split('T')[0]
    return parsed || '-'
  }

  const openDescriptionModal = (desc) => {
    setSelectedDescription(desc)
    setDescriptionModalOpen(true)
  }

  const changeStatus = async (id, newStatus) => {
    try{
      await api.patch(`/contents/${id}`, { status: newStatus })
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const updateDriveLink = async (id, driveLink) => {
    try{
      await api.patch(`/contents/${id}`, { drive_link: driveLink })
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const approve = async (id) => {
    try{
      await api.patch(`/contents/${id}`, { admin_approved: true })
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const unapprove = async (id) => {
    try{
      await api.patch(`/contents/${id}`, { admin_approved: false })
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const requestRevision = (id, name) => {
    setRevisionContentId(id)
    setRevisionContentName(name)
    setRevisionModalOpen(true)
  }

  const submitRevision = async (id, notes) => {
    try{
      await api.patch(`/contents/${id}`, { status: 'Revize Gerekli', revision_notes: notes })
      setRevisionModalOpen(false)
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const cancelContent = async (id) => {
    if (!window.confirm('Bu içeriği iptal etmek istediğinize emin misiniz?')) return
    try{
      await api.patch(`/contents/${id}`, { status: 'İptal' })
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const uncancelContent = async (id) => {
    if (!window.confirm('Bu içeriğin iptalini geri almak istediğinize emin misiniz?')) return
    try{
      await api.patch(`/contents/${id}`, { status: 'Yapıldı', admin_approved: false })
      onUpdated()
    }catch(err){
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || err.message)
      }
    }
  }

  const startEditLink = (id, currentLink) => {
    setEditingLinkId(id)
    setEditingLinkValue(currentLink || '')
  }

  const saveLink = async (id) => {
    await updateDriveLink(id, editingLinkValue)
    setEditingLinkId(null)
    setEditingLinkValue('')
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="px-2 py-2">Şirket</th>
              <th className="px-2 py-2">Tarih</th>
              <th className="px-2 py-2">Tür</th>
              <th className="px-2 py-2">Açıklama</th>
              <th className="px-2 py-2">Atanan</th>
              <th className="px-2 py-2">Durum</th>
              <th className="px-2 py-2">Drive Linki</th>
              <th className="px-2 py-2">Onay</th>
            </tr>
          </thead>
          <tbody>
            {contents.map(item => {
              const assignedEmail = usersMap[item.assigned_to] || item.assigned_to
              const canEdit = (localStorage.getItem('isAdmin') === '1') || (currentUserId && item.assigned_to === currentUserId)
              const hasRevisionNote = item.revision_notes && item.status === 'Revize Gerekli'
              
              return (
                <React.Fragment key={item.id}>
                <tr className={`border-b hover:bg-gray-50 ${hasRevisionNote ? 'bg-orange-50' : ''}`}>
                  <td className="px-2 py-2 font-medium">{item.company}</td>
                  <td className="px-2 py-2">{formatDate(item.publish_date)}</td>
                  <td className="px-2 py-2">{item.type}</td>
                  <td className="px-2 py-2">
                    {item.content_info ? (
                      <button
                        onClick={() => openDescriptionModal(item.content_info)}
                        className="text-blue-600 hover:underline text-xs max-w-xs truncate inline-block"
                        title="Tıkla: Tam açıklamayı görmek için"
                      >
                        {item.content_info.length > 30 ? item.content_info.substring(0, 30) + '...' : item.content_info}
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs">{assignedEmail}</td>
                  <td className="px-2 py-2">
                    {canEdit ? (
                      <select value={item.status} onChange={e=>changeStatus(item.id, e.target.value)} className="p-1 border rounded text-xs">
                        <option>Planlandı</option>
                        <option>Yapılıyor</option>
                        <option>Paylaşıldı</option>
                        <option>Yapıldı</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs ${statusClasses[item.status] || 'bg-gray-100'}`}>{item.status}</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {item.drive_link ? (
                      <div className="flex items-center gap-2">
                        <a href={item.drive_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-medium">
                          İçeriği Gör
                        </a>
                        {canEdit && (
                          <button 
                            onClick={() => startEditLink(item.id, item.drive_link)}
                            className="text-gray-600 hover:text-gray-900 text-sm"
                            title="Linki düzenle"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    ) : (item.status === 'Yapıldı' || item.status === 'Revize Gerekli') && canEdit ? (
                      <button 
                        onClick={() => startEditLink(item.id, '')}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        + Link Ekle
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {isAdmin ? (
                      item.status === 'İptal' ? (
                        <div className="flex gap-1 items-center">
                          <span className="text-red-700 font-semibold text-xs px-2 py-1 bg-red-100 rounded">✕ İptal Edildi</span>
                          <button
                            onClick={() => uncancelContent(item.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            title="İptali geri al"
                          >
                            Geri Al
                          </button>
                        </div>
                      ) : ((item.status === 'Yapıldı' || item.status === 'Revize Gerekli') && item.drive_link) ? (
                        <div className="flex gap-1 flex-wrap">
                          {item.admin_approved ? (
                            <div className="flex gap-1 items-center">
                              <span className="text-green-700 font-semibold text-xs px-2 py-1 bg-green-100 rounded">✓ Onaylandı</span>
                              <button
                                onClick={() => unapprove(item.id)}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                title="Onayı geri al"
                              >
                                Geri Al
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button onClick={()=>approve(item.id)} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 whitespace-nowrap">Onayla</button>
                              <button onClick={()=>requestRevision(item.id, item.company)} className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 whitespace-nowrap">Revize</button>
                              <button onClick={()=>cancelContent(item.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 whitespace-nowrap">İptal</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Bekleniyor</span>
                      )
                    ) : (
                      item.status === 'İptal' ? <span className="text-xs text-red-700 font-semibold">✕ İptal Edildi</span> : item.admin_approved ? <span className="text-xs text-green-700 font-semibold">✓ Onaylandı</span> : <span className="text-xs text-orange-700">⚠ Beklemede</span>
                    )}
                  </td>
                </tr>
                {hasRevisionNote && (
                  <tr key={`${item.id}-revision`} className="bg-orange-100 border-b">
                    <td colSpan="8" className="px-2 py-2">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">⚠️ Revize Notu:</span>
                        <span className="text-orange-900 font-medium">{item.revision_notes}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <DescriptionModal 
        open={descriptionModalOpen}
        description={selectedDescription}
        onClose={() => setDescriptionModalOpen(false)}
      />

      <AdminApprovalModal
        open={revisionModalOpen}
        contentId={revisionContentId}
        contentName={revisionContentName}
        onRevise={submitRevision}
        onClose={() => setRevisionModalOpen(false)}
      />

      {editingLinkId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Drive Link Düzenle</h3>
            <input
              type="text"
              value={editingLinkValue}
              onChange={e => setEditingLinkValue(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 border rounded mb-4 text-sm"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingLinkId(null)
                  setEditingLinkValue('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
              >
                İptal
              </button>
              <button
                onClick={() => saveLink(editingLinkId)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
