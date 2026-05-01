import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Package,
  Shield,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAdminOrders, getAdminStats, getAdminUsers } from '../../api/endpoints.js'
import { formatNaira } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { orderRef } from '../../components/orders/OrderRow.jsx'

const EMPTY_STATS = {
  total_users: 0,
  total_listings: 0,
  total_orders: 0,
  revenue: 0,
  pending_kyc: 0,
  orders_per_day: [],
  revenue_per_day: [],
}

const MONTH_REVENUE = [
  { month: 'Jan', value: 38 },
  { month: 'Feb', value: 52 },
  { month: 'Mar', value: 47 },
  { month: 'Apr', value: 64 },
  { month: 'May', value: 0 },
  { month: 'Jun', value: 0 },
]

function compactNumber(value) {
  return Number(value || 0).toLocaleString('en-NG')
}

function shortName(user) {
  if (!user) return 'User'
  const first = user.first_name || ''
  const last = user.last_name ? ` ${user.last_name[0]}.` : ''
  return `${first}${last}`.trim() || user.email || 'User'
}

function statCards(stats) {
  return [
    {
      label: 'Total users',
      value: compactNumber(stats.total_users),
      change: '+8.2%',
      up: true,
      icon: Users,
    },
    {
      label: 'Active listings',
      value: compactNumber(stats.total_listings),
      change: '+2.1%',
      up: true,
      icon: Package,
    },
    {
      label: 'Orders today',
      value: compactNumber(stats.total_orders),
      change: '-5.4%',
      up: false,
      icon: ShoppingBag,
    },
    {
      label: 'Revenue (30d)',
      value: formatNaira(stats.revenue || 0),
      change: '+14.7%',
      up: true,
      icon: TrendingUp,
    },
  ]
}

function StatCard({ stat }) {
  const StatIcon = stat.icon
  const TrendIcon = stat.up ? TrendingUp : TrendingDown

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-orange-50 text-brand flex items-center justify-center">
          <StatIcon size={16} />
        </div>
        <span
          className={[
            'inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded',
            stat.up ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50',
          ].join(' ')}
        >
          <TrendIcon size={10} />
          {stat.change}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
    </div>
  )
}

function OrdersChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={176}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="ordersGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#E8470A" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#E8470A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(date) => String(date).slice(5)} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={34} />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#E8470A" strokeWidth={2} fill="url(#ordersGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function RevenueBars() {
  const max = Math.max(...MONTH_REVENUE.map((row) => row.value), 1)

  return (
    <div className="flex items-end justify-between gap-3 h-44 pt-2">
      {MONTH_REVENUE.map((row) => (
        <div key={row.month} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full bg-gray-100 rounded-t-md relative overflow-hidden" style={{ height: 132 }}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-md"
              style={{ height: `${(row.value / max) * 100}%`, opacity: row.value ? 1 : 0.15 }}
            />
          </div>
          <span className="text-[11px] text-gray-400">{row.month}</span>
        </div>
      ))}
    </div>
  )
}

function RecentOrdersTable({ orders }) {
  const navigate = useNavigate()

  return (
    <div className="xl:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Recent orders</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          View all
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Order</th>
              <th className="text-left font-medium px-5 py-2.5">Buyer / Seller</th>
              <th className="text-left font-medium px-5 py-2.5">Amount</th>
              <th className="text-left font-medium px-5 py-2.5">Status</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-mono text-xs text-gray-700">{orderRef(order)}</td>
                <td className="px-5 py-3 text-gray-700">
                  {shortName(order.buyer)} / {shortName(order.seller)}
                </td>
                <td className="px-5 py-3 font-semibold text-gray-900">{formatNaira(order.total_amount || order.item_price || 0)}</td>
                <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="text-xs text-brand font-medium hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No recent orders</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PendingKycQueue({ users }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Pending KYC</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/kyc')}
          className="h-8 px-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Review
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {users.map((user) => (
          <div key={user.id} className="p-4 flex items-center gap-3">
            <UserAvatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{shortName(user)}</div>
              <div className="text-xs text-gray-500 font-mono truncate">{user.nin || user.bvn || user.email}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/kyc')}
              className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/kyc')}
              className="w-7 h-7 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">No pending KYC submissions</div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  })
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders', 'dashboard'],
    queryFn: () => getAdminOrders({}),
  })
  const { data: usersData } = useQuery({
    queryKey: ['admin-users', 'dashboard'],
    queryFn: () => getAdminUsers({}),
  })

  const stats = statsData || EMPTY_STATS
  const orders = (ordersData?.data || []).slice(0, 5)
  const pendingKyc = (usersData?.data || []).filter((user) => user.kyc_status === 'pending').slice(0, 4)
  const today = new Date().toLocaleDateString('en-NG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="max-w-7xl px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-sm text-gray-500 mt-0.5">Today, {today}</p>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats).map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Orders over time</h3>
              <p className="text-xs text-gray-500">Last 14 days</p>
            </div>
            <select className="h-9 w-32 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 bg-white focus:outline-none">
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </div>
          {statsLoading ? (
            <div className="h-44 rounded-lg bg-gray-50 animate-pulse" />
          ) : (
            <OrdersChart data={stats.orders_per_day || []} />
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Revenue by month</h3>
              <p className="text-xs text-gray-500">2026 YTD</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-brand ring-1 ring-orange-100 px-2 py-1 text-xs font-medium">
              +14.7% vs '25
            </span>
          </div>
          <RevenueBars />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RecentOrdersTable orders={orders} />
        <PendingKycQueue users={pendingKyc} />
      </div>
    </div>
  )
}
