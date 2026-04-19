import { X } from 'lucide-react'
import LoadingButton from './LoadingButton.jsx'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  isLoading = false,
}) {
  if (!isOpen) return null

  const confirmClass = {
    danger:    'btn-danger',
    primary:   'btn-primary',
    secondary: 'btn-secondary',
  }[confirmVariant] ?? 'btn-danger'

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-modal max-w-sm w-full p-6 z-10 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors -mr-1"
          >
            <X size={18} />
          </button>
        </div>
        {message && (
          <p className="text-sm text-gray-500 mb-6">{message}</p>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={isLoading} className="btn-secondary">
            Cancel
          </button>
          <LoadingButton onClick={onConfirm} isLoading={isLoading} className={confirmClass}>
            {confirmLabel}
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
