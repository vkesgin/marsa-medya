import React, { useEffect, useState } from 'react';

export default function Toast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const handler = (e) => {
      const { message, type, duration } = e.detail || {};
      if (!message) return;
      setToast({ show: true, message, type });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), duration || 2000);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  if (!toast.show) return null;

  const bg = toast.type === 'error' ? 'bg-red-600' : 'bg-green-600';
  const color = 'text-white';

  return (
    <div
      className={`fixed top-6 inset-x-0 flex justify-center px-4 transition-opacity`}>
      <div className={`${bg} ${color} px-6 py-3 rounded shadow-lg max-w-md text-center`}> 
        {toast.message}
      </div>
    </div>
  );
}
