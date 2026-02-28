import React from 'react'

export default function DescriptionModal({ open, description, onClose }){
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">İçerik Açıklaması</h3>
        <p className="text-gray-700 whitespace-pre-wrap break-words">
          {description || 'Açıklama yok'}
        </p>
        <button 
          onClick={onClose}
          className="mt-4 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}
