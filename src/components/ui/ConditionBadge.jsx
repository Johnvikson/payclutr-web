const MAP = {
  excellent: { label: 'New',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  very_good: { label: 'Like New',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  good:      { label: 'Good',      cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  fair:      { label: 'Fair',      cls: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200' },
}

export default function ConditionBadge({ condition, className = '' }) {
  const entry = MAP[condition] ?? { label: condition || '—', cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${entry.cls} ${className}`}>
      {entry.label}
    </span>
  )
}
