import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronRight } from 'lucide-react'
import { getOrders } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatDate, formatShipping } from '../../utils/formatters.js'
import { SkeletonRow } from '../../components/ui/Skeleton.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'

const TABS = [
  { key: 'all',     label: 'All' },
  { key: 'buying',  label: 'Buying' },
  { key: 'selling', label: 'Selling' },
]

// Best-effort short, abbreviated name: "Adaeze O." / "Tunde A."
function shortName(person) {
  if (!person) return ''
  const first = person.first_name || ''
  const last  = person.last_name || ''
  return `${first}${last ? ` ${last[0]}.` : ''}`.trim()
}

// Order reference like "PC-2841". Use uuid if it already starts with a prefix,
// otherwise fall back to PC-{id}.
function orderRef(order) {
  if (order.uuid) {
    const tail = String(order.uuid).slice(-4).toUpperCase()
    return `PC-${tail}`
  }
  return `PC-${String(order.id).padStart(4, '0')}`
}

function OrderRow({ order, role, onClick }) {
  const isBuying  = role === 'buying'
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

      {/* Title block */}
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

      {/* Right rail: price + shipping + chevron */}
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

export default function MyOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  })

  const buying  = orders.filter((o) => o.buyer?.id  === user?.id)
  const selling = orders.filter((o) => o.seller?.id === user?.id)

  // For each order, decide which side the current user is on so we render
  // the right "From"/"To" label even on the All tab.
  const taggedAll = orders.map((o) => ({
    order: o,
    role:  o.buyer?.id === user?.id ? 'buying' : 'selling',
  }))
  const taggedBuying  = buying.map((o)  => ({ order: o, role: 'buying'  }))
  const taggedSelling = selling.map((o) => ({ order: o, role: 'selling' }))

  const current =
    activeTab === 'buying'  ? taggedBuying  :
    activeTab === 'selling' ? taggedSelling :
                              taggedAll

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          My orders
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Track everything you're buying and selling
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 sm:gap-8 border-b border-gray-200 dark:border-zinc-800 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-brand'
                  : 'text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* List — single bordered container with row dividers */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : current.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Package size={22} className="text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">
              {activeTab === 'selling'
                ? 'No sales yet'
                : activeTab === 'buying'
                  ? 'No purchases yet'
                  : 'No orders yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 px-6">
              {activeTab === 'selling'
                ? 'List an item and start selling'
                : 'Browse listings to make your first order'}
            </p>
          </div>
        ) : (
          current.map(({ order, role }) => (
            <OrderRow
              key={order.id}
              order={order}
              role={role}
              onClick={() => navigate(`/orders/${order.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
