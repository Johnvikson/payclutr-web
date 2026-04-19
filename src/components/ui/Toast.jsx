import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-[340px] w-full pointer-events-none">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  )
}

const TYPE_CONFIG = {
  success: { icon: CheckCircle2, iconCls: 'text-emerald-500' },
  error:   { icon: XCircle,      iconCls: 'text-red-500' },
  info:    { icon: AlertCircle,  iconCls: 'text-blue-500' },
  warning: { icon: AlertCircle,  iconCls: 'text-amber-500' },
}

function ToastItem({ toast, onDismiss }) {
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info
  const Icon = cfg.icon
  return (
    <div className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-100 shadow-card rounded-xl px-4 py-3 animate-fade-in">
      <Icon size={17} className={`shrink-0 mt-0.5 ${cfg.iconCls}`} />
      <p className="text-sm text-gray-700 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
