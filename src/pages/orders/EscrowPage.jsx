import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Lock } from 'lucide-react'
import { getOrders } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira } from '../../utils/formatters.js'
import { SkeletonRow } from '../../components/ui/Skeleton.jsx'
import OrderRow, { ESCROW_STATUSES } from '../../components/orders/OrderRow.jsx'

const TABS = [
  { key: 'all',     label: 'All' },
  { key: 'buying',  label: 'As buyer' },
  { key: 'selling', label: 'As seller' },
]

export default function EscrowPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  })

  // Only orders where money is currently held in escrow
  const inEscrow = orders.filter((o) => ESCROW_STATUSES.has(o.status))

  const tagged = inEscrow.map((o) => ({
    order: o,
    role:  o.buyer?.id === user?.id ? 'buying' : 'selling',
  }))
  const current =
    activeTab === 'buying'  ? tagged.filter((t) => t.role === 'buying')  :
    activeTab === 'selling' ? tagged.filter((t) => t.role === 'selling') :
                              tagged

  // Total amount currently locked, across both sides
  const totalLocked = inEscrow.reduce((sum, o) => sum + (o.item_price || 0), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Escrow
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Funds and items currently held by PayClutr until both sides are happy
        </p>
      </div>

      {/* Locked balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-black text-white p-5 sm:p-6 mb-6">
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase tracking-wider">
              <Lock size={11} /> Held in escrow
            </div>
            <div className="text-3xl sm:text-4xl font-bold mt-1.5 tracking-tight">
              {isLoading ? '—' : formatNaira(totalLocked)}
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {inEscrow.length} active {inEscrow.length === 1 ? 'order' : 'orders'} · released on delivery confirmation
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-emerald-300" />
          </div>
        </div>
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

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : current.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={22} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">
              Nothing in escrow right now
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 px-6">
              Active orders awaiting delivery will appear here
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
