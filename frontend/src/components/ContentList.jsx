import React from 'react'
import api from '../services/api'

const statusClasses = {
  'Planlandı': 'bg-yellow-100 text-yellow-800',
  'Yapılıyor': 'bg-blue-100 text-blue-800',
  'Paylaşıldı': 'bg-green-100 text-green-800'
}

export default function ContentList({ contents = [], usersMap = {}, currentUserId = null, onUpdated = ()=>{} }){

  const changeStatus = async (id, newStatus) => {
    try{
      await api.patch(`/contents/${id}`, { status: newStatus })
      onUpdated()
    }catch(err){ alert(err.response?.data?.message || err.message) }
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="px-2 py-2">Şirket</th>
            <th className="px-2 py-2">Tarih</th>
            <th className="px-2 py-2">Tür</th>
            <th className="px-2 py-2">Atanan</th>
            <th className="px-2 py-2">Durum</th>
          </tr>
        </thead>
        <tbody>
          {contents.map(item => {
            const assignedEmail = usersMap[item.assigned_to] || item.assigned_to
            const canEdit = (localStorage.getItem('isAdmin') === '1') || (currentUserId && item.assigned_to === currentUserId)
            return (
              <tr key={item.id} className="border-b">
                <td className="px-2 py-2">{item.company}</td>
                <td className="px-2 py-2">{item.publish_date?.split('T')[0]}</td>
                <td className="px-2 py-2">{item.type}</td>
                <td className="px-2 py-2">{assignedEmail}</td>
                <td className="px-2 py-2">
                  {canEdit ? (
                    <select value={item.status} onChange={e=>changeStatus(item.id, e.target.value)} className="p-1 border rounded">
                      <option>Planlandı</option>
                      <option>Yapılıyor</option>
                      <option>Paylaşıldı</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded ${statusClasses[item.status] || 'bg-gray-100'}`}>{item.status}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
