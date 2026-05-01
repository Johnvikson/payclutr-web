import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  LifeBuoy,
  Lock,
  MessageCircle,
  Package,
  Scale,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { getOrders } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatDate } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { ESCROW_STATUSES, orderRef } from '../../components/orders/OrderRow.jsx'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const RECENT_RELEASE_CUTOFF = Date.now() - THIRTY_DAYS_MS

const PROTECTION_STEPS = [
  {
    Icon: Wallet,
    title: 'Buyer pays once',
    body: 'The full item price and delivery fee are collected before contact details unlock.',
  },
  {
    Icon: Lock,
    title: 'PayClutr holds funds',
    body: 'Money is ring-fenced while the seller accepts, packs, and ships the item.',
  },
  {
    Icon: MessageCircle,
    title: 'Chat stays on-platform',
    body: 'Messages, shipping proof, and dispute evidence remain attached to the order.',
  },
  {
    Icon: BadgeCheck,
    title: 'Release is controlled',
    body: 'Funds release only after delivery confirmation or a resolved support review.',
  },
]

const STATUS_COPY = {
  awaiting_seller_confirmation: 'Seller needs to accept before dispatch.',
  shipping_coordination: 'Delivery is being arranged before the item moves.',
  in_transit: 'Item is moving. Funds stay locked until delivery is confirmed.',
  disputed: 'Support is reviewing evidence before funds can move.',
}

function shortName(person) {
  if (!person) return ''
  const last = person.last_name ? ` ${person.last_name[0]}.` : ''
  return `${person.first_name || ''}${last}`.trim()
}

function orderAmount(order) {
  return Number(order?.total_amount || order?.item_price || 0)
}

function releasedAmount(order) {
  return Number(order?.seller_payout || order?.item_price || 0)
}

function orderImage(order) {
  return order?.listing?.images?.[0]?.image_url || order?.listing?.image_url || ''
}

function EmptyEscrowState() {
  return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
        <ShieldCheck size={20} className="text-emerald-500" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">
        Nothing held in escrow right now
      </p>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
        Active orders awaiting delivery will appear here.
      </p>
    </div>
  )
}

function OrderThumb({ order }) {
  const img = orderImage(order)

  return (
    <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
      {img ? (
        <img src={img} alt={order.listing?.title || 'Order item'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package size={16} className="text-gray-300 dark:text-zinc-600" />
        </div>
      )}
    </div>
  )
}

function ProtectionStep({ step }) {
  const StepIcon = step.Icon

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-brand flex items-center justify-center mb-3">
        <StepIcon size={16} />
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{step.title}</div>
      <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1.5 leading-relaxed">{step.body}</div>
    </div>
  )
}

export default function EscrowPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  })

  const activeHolds = orders.filter((order) => ESCROW_STATUSES.has(order.status))
  const totalHeld = activeHolds.reduce((sum, order) => sum + orderAmount(order), 0)
  const buyingHeld = activeHolds
    .filter((order) => order.buyer?.id === user?.id)
    .reduce((sum, order) => sum + orderAmount(order), 0)
  const sellingHeld = activeHolds
    .filter((order) => order.seller?.id === user?.id)
    .reduce((sum, order) => sum + orderAmount(order), 0)

  const releasedRows = orders
    .filter((order) => {
      const completedAt = order.completed_at ? new Date(order.completed_at).getTime() : 0
      return (
        order.status === 'completed' &&
        order.seller?.id === user?.id &&
        completedAt >= RECENT_RELEASE_CUTOFF
      )
    })
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

  const releasedTotal = releasedRows.reduce((sum, order) => sum + releasedAmount(order), 0)
  const visibleReleasedRows = releasedRows.slice(0, 3)

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={15} />
              Escrow protection
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
              Protected orders
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1 max-w-2xl">
              Track the money PayClutr is holding for your active marketplace trades.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              className="h-10 inline-flex items-center gap-2 px-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <LifeBuoy size={16} />
              Support
            </button>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="h-10 inline-flex items-center gap-2 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Search size={16} />
              View orders
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <div className="rounded-xl bg-zinc-950 dark:bg-black text-white p-5 sm:p-6 overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(232,71,10,.35),transparent_52%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-zinc-400 uppercase tracking-wider">Currently held</div>
                  <span className="inline-flex items-center rounded-full bg-white text-brand px-2 py-1 text-[11px] font-semibold">
                    {activeHolds.length} active {activeHolds.length === 1 ? 'hold' : 'holds'}
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-bold tracking-tight mt-3">
                  {isLoading ? '-' : formatNaira(totalHeld)}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 border border-white/10 p-3">
                    <div className="text-[11px] text-zinc-400">Buying</div>
                    <div className="text-base font-semibold mt-0.5">{isLoading ? '-' : formatNaira(buyingHeld)}</div>
                  </div>
                  <div className="rounded-lg bg-white/10 border border-white/10 p-3">
                    <div className="text-[11px] text-zinc-400">Selling</div>
                    <div className="text-base font-semibold mt-0.5">{isLoading ? '-' : formatNaira(sellingHeld)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Scale size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Release rules</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-relaxed">
                    Buyers confirm delivery to release funds. If anything goes wrong, PayClutr keeps the hold
                    active while support reviews the order evidence.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 p-3">
                  <div className="text-xs text-gray-500 dark:text-zinc-500">Released last 30 days</div>
                  <div className="font-bold text-gray-900 dark:text-zinc-100 mt-1">
                    {isLoading ? '-' : formatNaira(releasedTotal)}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 p-3">
                  <div className="text-xs text-gray-500 dark:text-zinc-500">Disputes open</div>
                  <div className="font-bold text-gray-900 dark:text-zinc-100 mt-1">
                    {activeHolds.filter((order) => order.status === 'disputed').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PROTECTION_STEPS.map((step) => (
            <ProtectionStep key={step.title} step={step} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Active escrow holds</h3>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="hidden sm:inline-flex text-xs font-medium text-brand hover:text-brand-700"
              >
                Open orders
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-gray-400 dark:text-zinc-500">Loading...</div>
              ) : activeHolds.length === 0 ? (
                <EmptyEscrowState />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {activeHolds.map((order) => {
                    const isBuying = order.buyer?.id === user?.id
                    const counterparty = isBuying ? order.seller : order.buyer

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <OrderThumb order={order} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">{orderRef(order)}</span>
                            <StatusBadge status={order.status} />
                            <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                              {isBuying ? 'Buying' : 'Selling'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 mt-1 line-clamp-1">
                            {order.listing?.title || 'Untitled item'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 truncate">
                            {isBuying ? 'From' : 'To'} {shortName(counterparty) || (isBuying ? 'seller' : 'buyer')} -{' '}
                            {STATUS_COPY[order.status] || 'Funds remain held until this order is resolved.'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                            {formatNaira(orderAmount(order))}
                          </div>
                          <div className="text-[11px] text-emerald-600 inline-flex items-center gap-1 mt-1">
                            <Lock size={10} /> Held
                          </div>
                        </div>
                        <ChevronRight size={16} className="hidden sm:block text-gray-300 dark:text-zinc-600 shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/70 dark:bg-amber-900/10 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Keep every trade inside PayClutr
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                  Chat and contact details unlock only after payment is held. Off-platform transfers, direct
                  shipping requests, and private chat apps remove escrow protection.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-3">Recently released</h3>
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-gray-400 dark:text-zinc-500">Loading...</div>
              ) : visibleReleasedRows.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={18} className="text-gray-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">No recent releases</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Completed seller payouts will show here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {visibleReleasedRows.map((order) => (
                    <div key={order.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 line-clamp-2">
                            {order.listing?.title || 'Untitled item'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                            {orderRef(order)} - {formatDate(order.completed_at)}
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-2">
                            {formatNaira(releasedAmount(order))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
