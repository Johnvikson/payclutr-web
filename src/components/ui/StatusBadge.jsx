import { formatStatus } from '../../utils/formatters.js'

const configs = {
  pending_payment:              { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50' },
  awaiting_seller_confirmation: { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50' },
  shipping_coordination:        { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50' },
  in_transit:                   { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50' },
  delivered:                    { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  completed:                    { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled:                    { dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-100' },
  disputed:                     { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50' },
  paid:                         { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  unpaid:                       { dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-100' },
  refunded:                     { dot: 'bg-purple-400',  text: 'text-purple-700',  bg: 'bg-purple-50' },
  pending:                      { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50' },
  verified:                     { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected:                     { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50' },
  open:                         { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50' },
  under_review:                 { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50' },
  resolved:                     { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  processing:                   { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50' },
  approved:                     { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  processed:                    { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  active:                       { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  sold:                         { dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-100' },
  delisted:                     { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50' },
  inactive:                     { dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-100' },
  banned:                       { dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50' },
  credit:                       { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  debit:                        { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50' },
}

export default function StatusBadge({ status, className = '' }) {
  const cfg = configs[status] ?? { dot: 'bg-gray-400', text: 'text-gray-500', bg: 'bg-gray-100' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {formatStatus(status)}
    </span>
  )
}
