// Status badge — pill with colored dot + text. Replaces ad-hoc badge styling.

const TONES = {
  pending:   'bg-amber-50 text-amber-700 ring-amber-100',
  active:    'bg-emerald-50 text-emerald-700 ring-emerald-100',
  verified:  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  success:   'bg-emerald-50 text-emerald-700 ring-emerald-100',
  completed: 'bg-blue-50 text-blue-700 ring-blue-100',
  info:      'bg-blue-50 text-blue-700 ring-blue-100',
  rejected:  'bg-red-50 text-red-700 ring-red-100',
  cancelled: 'bg-red-50 text-red-700 ring-red-100',
  sold:      'bg-gray-100 text-gray-600 ring-gray-200',
  gray:      'bg-gray-100 text-gray-600 ring-gray-200',
  brand:     'bg-orange-50 text-brand ring-orange-100',
}

const DOT = {
  pending: 'bg-amber-500', active: 'bg-emerald-500', verified: 'bg-emerald-500', success: 'bg-emerald-500',
  completed: 'bg-blue-500', info: 'bg-blue-500', rejected: 'bg-red-500', cancelled: 'bg-red-500',
  sold: 'bg-gray-400', gray: 'bg-gray-400', brand: 'bg-brand',
}

export default function Badge({ tone = 'gray', size = 'sm', dot = true, children, className = '' }) {
  const sizing = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset font-medium ${TONES[tone]} ${sizing} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT[tone]}`} />}
      {children}
    </span>
  )
}
