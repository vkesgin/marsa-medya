import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { showToast } from '../utils/toast'

const CONTENT_TYPES = ['Story', 'Post', 'Reels']

export default function ContentModal({ open, onClose, onCreated }){
  const [form, setForm] = useState({ company: '', publish_date: '', content_info: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [errors, setErrors] = useState({})
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [newCompany, setNewCompany] = useState('')

  useEffect(()=>{
    if(!open) return
    setForm({ company: '', publish_date: '', content_info: '', type: '' })
    setErrors({})
    setShowNewCompany(false)
    setNewCompany('')
    
    const fetchData = async ()=>{
      try{
        const res = await api.get('/contents')
        // GET mevcut şirketleri
        const uniqueCompanies = [...new Set((res.data.data || []).map(c => c.company).filter(Boolean))].sort()
        setCompanies(uniqueCompanies)
      }catch(e){
        setCompanies([])
      }
    }
    fetchData()
  }, [open])

  if(!open) return null

  const change = (k,v) => setForm(prev=>({ ...prev, [k]: v }))

  const validate = () => {
    const e = {}
    if(!form.company) e.company = 'Şirket adı zorunlu.'
    if(!form.publish_date) e.publish_date = 'Tarih zorunlu.'
    if(!form.type) e.type = 'Tür zorunlu.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault();
    if(!validate()) return
    setLoading(true)
    try{
      await api.post('/contents', form)
      showToast('İçerik başarıyla eklendi.', 'success', 2000)
      onCreated && onCreated()
      setTimeout(()=> onClose && onClose(), 800)
    }catch(err){
      showToast(err.response?.data?.message || err.message, 'error', 3000)
    }finally{ setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white p-6 rounded w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg mb-4">Yeni İçerik</h3>
        
        <label className="block mb-3">
          <div className="font-medium text-sm mb-1">Şirket</div>
          {!showNewCompany ? (
            <div className="flex gap-2">
              <select 
                value={form.company} 
                onChange={e=>change('company', e.target.value)} 
                className="flex-1 p-2 border rounded"
              >
                <option value="">-- Seçiniz --</option>
                {companies.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
              <button 
                type="button"
                onClick={()=>setShowNewCompany(true)} 
                className="px-3 py-2 bg-gray-600 text-white rounded text-sm"
              >
                Yeni
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="text"
                value={newCompany} 
                onChange={e=>setNewCompany(e.target.value)} 
                placeholder="Şirket adı"
                className="flex-1 p-2 border rounded"
                onBlur={() => {
                  if(newCompany) change('company', newCompany)
                  setShowNewCompany(false)
                }}
              />
              <button 
                type="button"
                onClick={()=>setShowNewCompany(false)} 
                className="px-3 py-2 bg-gray-600 text-white rounded text-sm"
              >
                İptal
              </button>
            </div>
          )}
          {errors.company && <p className="text-sm text-red-600 mt-1">{errors.company}</p>}
        </label>

        <label className="block mb-3">
          <div className="font-medium text-sm mb-1">Tarih</div>
          <input type="date" value={form.publish_date} onChange={e=>change('publish_date', e.target.value)} className="w-full p-2 border rounded" />
          {errors.publish_date && <p className="text-sm text-red-600">{errors.publish_date}</p>}
        </label>

        <label className="block mb-3">
          <div className="font-medium text-sm mb-1">Tür</div>
          <select value={form.type} onChange={e=>change('type', e.target.value)} className="w-full p-2 border rounded">
            <option value="">-- Seçiniz --</option>
            {CONTENT_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
        </label>

        <label className="block mb-4">
          <div className="font-medium text-sm mb-1">Açıklama</div>
          <textarea 
            value={form.content_info} 
            onChange={e=>change('content_info', e.target.value)} 
            placeholder="Yapılacak içerik hakkında bilgi..."
            className="w-full p-2 border rounded"
            rows="3"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 border rounded">İptal</button>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
      </form>
    </div>
  )
}
