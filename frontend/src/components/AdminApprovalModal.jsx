import React, { useState } from 'react'

export default function AdminApprovalModal({ open, contentId, contentName, onRevise, onClose }){
  const [revisionNotes, setRevisionNotes] = useState('')

  const handleSubmit = () => {
    if (!revisionNotes.trim()) {
      alert('Revize notu yazınız')
      return
    }
    onRevise(contentId, revisionNotes)
    setRevisionNotes('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Revize İste</h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{contentName}</strong> için yapılması gerekenler nelerdir?
        </p>
        <textarea
          value={revisionNotes}
          onChange={e => setRevisionNotes(e.target.value)}
          placeholder="Revize edilmesi gerekenler..."
          className="w-full p-2 border rounded mb-4"
          rows="4"
        />
        <div className="flex gap-2 justify-end">
          <button 
            onClick={onClose}
            className="px-3 py-2 border rounded hover:bg-gray-100"
          >
            İptal
          </button>
          <button 
            onClick={handleSubmit}
            className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Revize İste
          </button>
        </div>
      </div>
    </div>
  )
}
