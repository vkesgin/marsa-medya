import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { showToast } from '../utils/toast'

export default function Companies(){
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const isAdmin = localStorage.getItem('isAdmin') === '1'

  useEffect(()=>{
    if (!isAdmin) {
      navigate('/dashboard', { replace: true })
      return
    }
    setError(null)
    fetchCompanies()
  }, [navigate, isAdmin])

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/contents')
      const uniqueCompanies = [...new Set((res.data.data || []).map(c => c.company).filter(Boolean))].sort()
      setCompanies(uniqueCompanies.map((name, idx) => ({ id: idx, name })))
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Şirket listesi yüklenemedi'
      setError(errMsg)
      showToast(errMsg, 'error', 3000)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const deleteCompany = async (companyName) => {
    if (!window.confirm(`"${companyName}" şirketini silmek istediğinize emin misiniz?\nBu şirkete bağlı tüm içerikler silinecektir!`)) return

    try {
      // Önce bu şirkete bağlı tüm içerikleri sil
      const contentsToDelete = (await api.get('/contents')).data.data || []
      const itemsToDelete = contentsToDelete.filter(c => c.company === companyName)
      
      for (const item of itemsToDelete) {
        await api.delete(`/contents/${item.id}`)
      }

      showToast('Şirket ve bağlı içerikler silindi', 'success', 2000)
      fetchCompanies()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  const updateCompany = async (oldName, newName) => {
    if (!newName.trim()) {
      showToast('Şirket adı boş olamaz', 'warning', 2000)
      return
    }

    if (companies.some(c => c.name.toLowerCase() === newName.trim().toLowerCase() && c.name !== oldName)) {
      showToast('Bu şirket zaten var', 'warning', 2000)
      return
    }

    try {
      // Bu şirkete bağlı tüm içerikleri güncelle
      const contentsToUpdate = (await api.get('/contents')).data.data || []
      const itemsToUpdate = contentsToUpdate.filter(c => c.company === oldName)
      
      for (const item of itemsToUpdate) {
        await api.patch(`/contents/${item.id}`, { company: newName.trim() })
      }

      showToast('Şirket adı güncellendi', 'success', 2000)
      setEditingId(null)
      setEditName('')
      fetchCompanies()
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Şirket Yönetimi</h2>
        <button onClick={()=>navigate('/dashboard')} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Geri</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm text-blue-700">
          <strong>Not:</strong> Yeni şirket eklemek için içerik ekleme panelinde "Yeni" butonuna tıklayarak ekleyebilirsiniz.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Yükleniyor...</p>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <p><strong>Hata:</strong> {error}</p>
          <button 
            onClick={fetchCompanies}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <div>
          {companies.length > 0 ? (
            <div className="grid gap-3">
              {companies.map(company => (
                <div key={company.id} className="bg-white border rounded p-4 flex items-center justify-between">
                  {editingId === company.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 p-2 border rounded"
                        placeholder="Yeni şirket adı"
                        autoFocus
                      />
                      <button
                        onClick={() => updateCompany(company.name, editName)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditName('')
                        }}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg font-medium">{company.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(company.id)
                            setEditName(company.name)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => deleteCompany(company.name)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Sil
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Henüz hiç şirket eklenmemiş.</p>
          )}
        </div>
      )}
    </div>
  )
}
