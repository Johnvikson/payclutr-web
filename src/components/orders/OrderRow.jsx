import { Package, ChevronRight } from 'lucide-react'
import { formatNaira, formatDate, formatShipping } from '../../utils/formatters.js'
import StatusBadge from '../ui/StatusBadge.jsx'

// "Adaeze O." style abbreviation
function shortName(person) {
  if (!person) return ''
  const first = person.first_name || ''
  const last  = person.last_name || ''
  return `${first}${last ? ` ${last[0]}.` : ''}`.trim()
}

// "PC-2841" — last 4 chars of uuid (uppercased), or padded id fallback
export function orderRef(order) {
  if (order?.uuid) {
    const tail = String(order.uuid).slice(-4).toUpperCase()
    return `PC-${tail}`
  }
  return `PC-${String(order?.id ?? '').padStart(4, '0')}`
}

/**
 * Single order row used on My Orders + Escrow pages.
 * `role` is 'buying' | 'selling' from the perspective of the current user.
 */
export default function OrderRow({ order, role, onClick }) {
  const isBuying = role === 'buying'
  const counterparty = isBuying ? order.seller : order.buyer
  const img = order.listing?.images?.[0]?.image_url

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-stretch gap-4 px-4 py-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 last:border-b-0 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
        {img ? (
          <img src={img} alt={order.listing?.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={20} className="text-gray-300 dark:text-zinc-600" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 tracking-wider">
            {orderRef(order)}
          </span>
          <StatusBadge status={order.status} />
        </div>

        <p className="mt-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1">
          {order.listing?.title || 'Untitled item'}
        </p>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
          {isBuying ? 'From' : 'To'} {shortName(counterparty) || (isBuying ? 'Seller' : 'Buyer')}
          <span className="mx-1.5 text-gray-300 dark:text-zinc-600">·</span>
          {formatDate(order.created_at)}
        </p>
      </div>

      {/* Right rail */}
      <div className="shrink-0 flex items-center gap-2 sm:gap-3">
        <div className="text-right">
          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
            {formatNaira(order.item_price)}
          </p>
          {order.shipping_method && (
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">
              {formatShipping(order.shipping_method)}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600 shrink-0" />
      </div>
    </button>
  )
}

// Statuses that mean the money is currently held in escrow (not yet released)
export const ESCROW_STATUSES = new Set([
  'awaiting_seller_confirmation',
  'shipping_coordination',
  'in_transit',
  'disputed',
])
