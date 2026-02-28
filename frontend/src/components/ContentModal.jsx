import React, { useState, useEffect } from 'react'
import api from '../services/api'

export default function ContentModal({ open, onClose, onCreated }){
  const [form, setForm] = useState({ company: '', publish_date: '', content_info: '', type: '', assigned_to: '' })
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(()=>{
    if(!open) return
    setForm({ company: '', publish_date: '', content_info: '', type: '', assigned_to: '' })
    setErrors({})
    const fetchUsers = async ()=>{
      try{
        const res = await api.get('/users')
        setUsers(res.data.data || [])
      }catch(e){
        setUsers([])
      }
    }
    fetchUsers()
  }, [open])

  useEffect(()=>{
    if(!toast.show) return
    const t = setTimeout(()=> setToast({ show:false, message:'', type:'success' }), 3000)
    return ()=> clearTimeout(t)
  }, [toast.show])

  if(!open) return null

  const change = (k,v) => setForm(prev=>({ ...prev, [k]: v }))

  const validate = () => {
    const e = {}
    if(!form.company) e.company = 'Şirket adı zorunlu.'
    if(!form.publish_date) e.publish_date = 'Tarih zorunlu.'
    if(!form.type) e.type = 'Tür zorunlu.'
    if(!form.assigned_to) e.assigned_to = 'Atanan kullanıcı seçiniz.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault();
    if(!validate()) return
    setLoading(true)
    try{
      await api.post('/contents', form)
      setToast({ show:true, message: 'İçerik başarıyla eklendi.', type: 'success' })
      onCreated && onCreated()
      // keep toast visible briefly before closing
      setTimeout(()=> onClose && onClose(), 800)
    }catch(err){
      setToast({ show:true, message: err.response?.data?.message || err.message, type: 'error' })
    }finally{ setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-6 rounded w-full max-w-lg">
        <h3 className="text-lg mb-4">Yeni İçerik</h3>
        <label className="block mb-2">Şirket
          <input value={form.company} onChange={e=>change('company', e.target.value)} className="w-full p-2 border rounded" />
          {errors.company && <p className="text-sm text-red-600">{errors.company}</p>}
        </label>
        <label className="block mb-2">Tarih
          <input type="date" value={form.publish_date} onChange={e=>change('publish_date', e.target.value)} className="w-full p-2 border rounded" />
          {errors.publish_date && <p className="text-sm text-red-600">{errors.publish_date}</p>}
        </label>
        <label className="block mb-2">Tür
          <input value={form.type} onChange={e=>change('type', e.target.value)} className="w-full p-2 border rounded" />
          {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
        </label>
        <label className="block mb-2">Atanan
          <select value={form.assigned_to} onChange={e=>change('assigned_to', e.target.value)} className="w-full p-2 border rounded">
            <option value="">-- Seçiniz --</option>
            {users.length ? users.map(u=> <option key={u.id} value={u.id}>{u.email}</option>) : <option value="">(Kullanıcı listesi yok)</option>}
          </select>
          {errors.assigned_to && <p className="text-sm text-red-600">{errors.assigned_to}</p>}
        </label>
        <label className="block mb-4">Açıklama
          <textarea value={form.content_info} onChange={e=>change('content_info', e.target.value)} className="w-full p-2 border rounded" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 border rounded">İptal</button>
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
      </form>

      {toast.show && (
        <div className={`fixed top-6 right-6 px-4 py-2 rounded shadow ${toast.type==='error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
