import { useQuery } from '@tanstack/react-query'
import {
  Users, Tag, ShoppingBag, TrendingUp, DollarSign,
  AlertTriangle, Clock, Shield, UserPlus, CheckCircle,
  ArrowUpRight, BadgeCheck,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getAdminStats } from '../../api/endpoints.js'
import { formatNaira } from '../../utils/formatters.js'

const buildStats = (s) => [
  { label: 'Total Users',         value: s.total_users,          icon: Users,         iconClass: 'bg-blue-100 text-blue-600' },
  { label: 'Total Listings',      value: s.total_listings,       icon: Tag,           iconClass: 'bg-brand-50 text-brand-600' },
  { label: 'Total Orders',        value: s.total_orders,         icon: ShoppingBag,   iconClass: 'bg-purple-100 text-purple-600' },
  { label: 'GMV',                 value: formatNaira(s.gmv),     icon: TrendingUp,    iconClass: 'bg-green-100 text-green-600' },
  { label: 'Total Revenue',       value: formatNaira(s.revenue), icon: DollarSign,    iconClass: 'bg-emerald-100 text-emerald-600' },
  { label: 'Open Disputes',       value: s.open_disputes,        icon: AlertTriangle, iconClass: 'bg-red-100 text-red-600' },
  { label: 'Pending Withdrawals', value: s.pending_withdrawals,  icon: Clock,         iconClass: 'bg-yellow-100 text-yellow-600' },
  { label: 'Pending KYC',         value: s.pending_kyc,          icon: Shield,        iconClass: 'bg-indigo-100 text-indigo-600' },
]

const activities = [
  { text: 'New user registered: Chidi Nwosu',          icon: UserPlus,      bg: 'bg-blue-100',   color: 'text-blue-600',   time: '2m ago' },
  { text: 'Order completed: Samsung TV — ₦180,000',    icon: CheckCircle,   bg: 'bg-green-100',  color: 'text-green-600',  time: '8m ago' },
  { text: 'Dispute raised on order #ord_004',           icon: AlertTriangle, bg: 'bg-red-100',    color: 'text-red-600',    time: '15m ago' },
  { text: 'KYC submitted: Fatima Bello',                icon: Shield,        bg: 'bg-indigo-100', color: 'text-indigo-600', time: '22m ago' },
  { text: 'Withdrawal requested: ₦30,000',              icon: ArrowUpRight,  bg: 'bg-yellow-100', color: 'text-yellow-600', time: '31m ago' },
  { text: 'New listing: iPhone 13 Pro Max',             icon: Tag,           bg: 'bg-brand-50',   color: 'text-brand-600', time: '45m ago' },
  { text: 'Order placed: HP Laptop',                    icon: ShoppingBag,   bg: 'bg-purple-100', color: 'text-purple-600', time: '1h ago' },
  { text: 'KYC approved: Victor Johnson',               icon: BadgeCheck,    bg: 'bg-green-100',  color: 'text-green-600',  time: '2h ago' },
]

const fmtRevY = (v) => {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`
  return `₦${v}`
}

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats })

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  if (!stats) return null

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Admin</p>
        </div>
        <span className="text-sm text-gray-400">{today}</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {buildStats(stats).map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Orders (Last 7 Days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.orders_per_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#E8470A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Revenue (Last 7 Days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.revenue_per_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtRevY} />
              <Tooltip formatter={(v) => [formatNaira(v), 'Revenue']} />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity feed */}
      <div className="mt-8">
        <p className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</p>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {activities.map(({ text, icon: Icon, bg, color, time }, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-b-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={14} className={color} />
              </div>
              <span className="text-sm text-gray-700 flex-1">{text}</span>
              <span className="text-xs text-gray-400 shrink-0">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
