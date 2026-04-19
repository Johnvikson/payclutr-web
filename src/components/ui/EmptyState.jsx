import { PackageOpen } from 'lucide-react'

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={22} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-5 btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
