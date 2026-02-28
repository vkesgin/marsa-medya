import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import ContentList from '../components/ContentList'
import ContentModal from '../components/ContentModal'
import Header from '../components/Header'

export default function Dashboard(){
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [usersMap, setUsersMap] = useState({})
  const [filterStatus, setFilterStatus] = useState('Tümü')
  const [query, setQuery] = useState('')
  const location = useLocation()
  const [toast, setToast] = useState({ show:false, message:'', type:'success' })

  const fetchContents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/contents')
      setContents(res.data.data || [])
      const isAdmin = localStorage.getItem('isAdmin') === '1'
      if(isAdmin){
        try{
          const ures = await api.get('/users')
          const map = (ures.data.data || []).reduce((acc,u)=>{ acc[u.id]=u.email; return acc }, {})
          setUsersMap(map)
        }catch(e){ setUsersMap({}) }
      } else {
        setUsersMap({})
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ fetchContents() }, [])

  useEffect(()=>{
    if(location.state?.message){
      setToast({ show:true, message: location.state.message, type:'success' })
      window.history.replaceState({}, document.title) // clear state so toast not shown again
    }
  }, [location])

  useEffect(()=>{
    if(!toast.show) return
    const t = setTimeout(()=> setToast({ show:false, message:'', type:'success' }), 3000)
    return ()=> clearTimeout(t)
  }, [toast.show])

  const isAdmin = localStorage.getItem('isAdmin') === '1'

  const visibleContents = contents.filter(c=>{
    if(filterStatus !== 'Tümü'){
      if(filterStatus === 'Onaylandı'){
        if(!c.approved) return false
      } else if(filterStatus === 'Onaylanmadı'){
        if(c.approved) return false
      } else if(c.status !== filterStatus){
        return false
      }
    }
    if(query){
      const q = query.toLowerCase()
      return (c.company||'').toLowerCase().includes(q) || (c.content_info||'').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="p-6">
      <Header />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">{isAdmin ? 'İçerikler' : 'Bana Atanan İçerikler'}</h2>
        {isAdmin && <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={()=>setOpenModal(true)}>Yeni İçerik Ekle</button>}
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="p-2 border rounded">
          <option>Tümü</option>
          <option>Planlandı</option>
          <option>Yapılıyor</option>
          <option>Paylaşıldı</option>
          <option>Onaylandı</option>
          <option>Onaylanmadı</option>
        </select>
        <input placeholder="Ara (şirket veya içerik)" value={query} onChange={e=>setQuery(e.target.value)} className="p-2 border rounded flex-1" />
        <button onClick={()=>{ setFilterStatus('Tümü'); setQuery('') }} className="px-3 py-1 border rounded">Sıfırla</button>
      </div>

      {toast.show && (
        <div className={`fixed top-6 right-6 px-4 py-2 rounded shadow ${toast.type==='error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.message}
        </div>
      )}
      {loading ? <p>Yükleniyor...</p> : (
        visibleContents.length ? (
          <ContentList contents={visibleContents} usersMap={usersMap} currentUserId={JSON.parse(localStorage.getItem('user') || 'null')?.id} onUpdated={fetchContents} />
        ) : (
          <p>Gösterilecek içerik yok.</p>
        )
      )}

      <ContentModal open={openModal} onClose={()=>setOpenModal(false)} onCreated={()=>{setOpenModal(false); fetchContents();}} />
    </div>
  )
}
