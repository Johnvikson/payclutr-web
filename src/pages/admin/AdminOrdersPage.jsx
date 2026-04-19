import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAdminOrders } from '../../api/endpoints.js'
import { formatNaira, formatDate, formatShipping } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'

const PER_PAGE = 10

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: () => getAdminOrders({ search, status: statusFilter }),
  })

  const orders = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pageOrders = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{total}</span>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by order ID or item..."
            className="h-10 w-full pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="awaiting_seller_confirmation">Awaiting Confirmation</option>
          <option value="shipping_coordination">Shipping Coordination</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Order ID', 'Item', 'Buyer', 'Seller', 'Amount', 'Status', 'Method', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{order.uuid}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-[180px] truncate">{order.listing?.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={order.buyer} size="sm" />
                      <span className="text-sm text-gray-700 whitespace-nowrap">{order.buyer?.first_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={order.seller} size="sm" />
                      <span className="text-sm text-gray-700 whitespace-nowrap">{order.seller?.first_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{formatNaira(order.item_price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatShipping(order.shipping_method)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</td>
                </tr>
              ))}
              {pageOrders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total} orders</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  )
}
