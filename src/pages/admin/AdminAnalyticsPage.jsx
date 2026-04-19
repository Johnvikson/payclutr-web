import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { getAdminStats, getAdminOrders, getAdminListings } from '../../api/endpoints.js'
import { formatNaira } from '../../utils/formatters.js'

const COLORS = ['#E8470A', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

const downloadCSV = (data, filename) => {
  if (!data?.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row) => Object.values(row).join(',')).join('\n')
  const csv = headers + '\n' + rows
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const fmtRevY = (v) => {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`
  return `₦${v}`
}

const mockTopSellers = [
  { name: 'Amaka Obi',       gmv: 8_500_000_00 },
  { name: 'Victor Johnson',  gmv: 6_200_000_00 },
  { name: 'Fatima Bello',    gmv: 5_100_000_00 },
  { name: 'Emeka Eze',       gmv: 3_800_000_00 },
  { name: 'Chidi Nwosu',     gmv: 2_900_000_00 },
]

export default function AdminAnalyticsPage() {
  const [from, setFrom] = useState('2026-02-01')
  const [to, setTo] = useState('2026-02-28')

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats })
  const { data: ordersData } = useQuery({ queryKey: ['admin-orders'], queryFn: () => getAdminOrders({}) })
  const { data: listingsData } = useQuery({ queryKey: ['admin-listings'], queryFn: () => getAdminListings({}) })

  const orders = ordersData?.data ?? []
  const listings = listingsData?.data ?? []

  // Status breakdown for pie
  const statusCount = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

  // Category breakdown
  const catCount = listings.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1
    return acc
  }, {})
  const catData = Object.entries(catCount).map(([category, count]) => ({ category, count }))

  const avgOrderValue = orders.length ? orders.reduce((a, o) => a + o.item_price, 0) / orders.length : 0
  const completedOrders = orders.filter((o) => o.status === 'completed').length
  const disputedOrders = orders.filter((o) => o.status === 'disputed').length
  const completionRate = orders.length ? ((completedOrders / orders.length) * 100).toFixed(1) : '0'
  const disputeRate = orders.length ? ((disputedOrders / orders.length) * 100).toFixed(1) : '0'

  if (!stats) return null

  const summaryCards = [
    { label: 'Revenue',         value: formatNaira(stats.revenue) },
    { label: 'Orders',          value: stats.total_orders },
    { label: 'GMV',             value: formatNaira(stats.gmv) },
    { label: 'Avg Order Value', value: formatNaira(avgOrderValue) },
    { label: 'Dispute Rate',    value: `${disputeRate}%` },
    { label: 'Completion Rate', value: `${completionRate}%` },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none"
          />
          <button className="h-9 px-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
            Apply
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-6">
        {summaryCards.map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-base font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue over time */}
      <div className="mt-6 bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Revenue Over Time</p>
          <button
            onClick={() => downloadCSV(stats.revenue_per_day, 'revenue.csv')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.revenue_per_day}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtRevY} />
            <Tooltip formatter={(v) => [formatNaira(v), 'Revenue']} />
            <Line type="monotone" dataKey="amount" stroke="#E8470A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Orders by Status</p>
            <button
              onClick={() => downloadCSV(statusData, 'orders-by-status.csv')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Top Categories</p>
            <button
              onClick={() => downloadCSV(catData, 'categories.csv')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#E8470A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top sellers */}
      <div className="mt-6 bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Top 5 Sellers by GMV</p>
          <button
            onClick={() => downloadCSV(mockTopSellers, 'top-sellers.csv')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={mockTopSellers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtRevY(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
            <Tooltip formatter={(v) => [formatNaira(v), 'GMV']} />
            <Bar dataKey="gmv" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
