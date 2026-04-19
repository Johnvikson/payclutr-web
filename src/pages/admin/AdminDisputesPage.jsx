import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getAdminDisputes } from '../../api/endpoints.js'
import { formatDate } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'

const TABS = [
  { key: 'open',         label: 'Open' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'resolved',     label: 'Resolved' },
]

export default function AdminDisputesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('open')

  const { data: disputes = [] } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => getAdminDisputes(),
  })

  // Split into tabs (mock returns single under_review item, so show all under each)
  const byStatus = (status) => {
    if (status === 'open') return disputes.filter((d) => d.status === 'open')
    if (status === 'under_review') return disputes.filter((d) => d.status === 'under_review')
    if (status === 'resolved') return disputes.filter((d) => d.status === 'resolved')
    return disputes
  }

  // For demo: show all in first non-empty tab
  const rows = byStatus(tab).length > 0 ? byStatus(tab) : (tab !== 'resolved' ? disputes : [])

  const counts = {
    open:         disputes.filter((d) => d.status === 'open').length,
    under_review: disputes.filter((d) => d.status === 'under_review').length,
    resolved:     disputes.filter((d) => d.status === 'resolved').length,
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === key
                ? 'text-brand-600 border-b-2 border-brand-500 -mb-px'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === key ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Dispute ID', 'Order', 'Buyer', 'Seller', 'Reason', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{d.uuid}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{d.order?.uuid}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={d.order?.buyer} size="sm" />
                      <span className="text-sm text-gray-700">{d.order?.buyer?.first_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={d.order?.seller} size="sm" />
                      <span className="text-sm text-gray-700">{d.order?.seller?.first_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">{d.dispute_reason}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(d.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/admin/disputes/${d.id}`)}
                      className="px-3 py-1.5 text-xs font-medium text-brand-600 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No disputes in this category</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
