import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronRight } from 'lucide-react'
import { getOrders } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatDate, formatShipping } from '../../utils/formatters.js'
import { SkeletonRow } from '../../components/ui/Skeleton.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'

const TABS = [
  { key: 'buying',  label: 'Buying' },
  { key: 'selling', label: 'Selling' },
]

function OrderCard({ order, role }) {
  const navigate = useNavigate()
  const otherParty = role === 'buying' ? order.seller : order.buyer
  const img = order.listing?.images?.[0]?.image_url

  return (
    <div
      onClick={() => navigate(`/orders/${order.id}`)}
      className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl mb-2 cursor-pointer hover:border-gray-200 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
        {img ? (
          <img src={img} alt={order.listing?.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={18} className="text-gray-300 dark:text-zinc-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 line-clamp-1">{order.listing?.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={order.status} />
          <span className="text-xs text-gray-400 dark:text-zinc-500">{formatShipping(order.shipping_method)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <UserAvatar user={otherParty} size="xs" />
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            {role === 'buying' ? 'Seller' : 'Buyer'}: {otherParty?.first_name} {otherParty?.last_name}
          </span>
          <span className="text-gray-300 dark:text-zinc-600">·</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(order.created_at)}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{formatNaira(order.item_price)}</p>
        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600" />
      </div>
    </div>
  )
}

export default function MyOrdersPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('buying')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  })

  const buying  = orders.filter((o) => o.buyer?.id  === user?.id)
  const selling = orders.filter((o) => o.seller?.id === user?.id)
  const current = activeTab === 'buying' ? buying : selling

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">My Orders</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">Track and manage your transactions</p>
      </div>

      <div className="flex gap-1 border-b border-gray-100 dark:border-zinc-800 mb-6">
        {TABS.map(({ key, label }) => {
          const count = key === 'buying' ? buying.length : selling.length
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative pb-3 px-1 mr-5 text-sm font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
              }`}
            >
              {label}
              {!isLoading && count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-50 dark:bg-orange-900/20 text-brand' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      <div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : current.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={36} className="text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              {activeTab === 'buying' ? 'No orders yet' : 'No sales yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
              {activeTab === 'buying'
                ? 'Browse listings and buy something!'
                : 'List an item and start selling'}
            </p>
          </div>
        ) : (
          current.map((order) => (
            <OrderCard key={order.id} order={order} role={activeTab} />
          ))
        )}
      </div>
    </div>
  )
}
