import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminWithdrawals, processWithdrawal, rejectWithdrawal } from '../../api/endpoints.js'
import { formatNaira, formatDate } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { mockUser } from '../../api/mock.js'

function InputModal({ title, placeholder, onConfirm, onClose }) {
  const [value, setValue] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => value.trim() && onConfirm(value)}
            disabled={!value.trim()}
            className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminWithdrawalsPage() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [tab, setTab] = useState('pending')
  const [modal, setModal] = useState(null) // { type: 'process'|'reject', id }

  const { data } = useQuery({ queryKey: ['admin-withdrawals'], queryFn: getAdminWithdrawals })

  const mutProcess = useMutation({
    mutationFn: ({ id, ref }) => processWithdrawal(id, ref),
    onSuccess: () => { qc.invalidateQueries(['admin-withdrawals']); showToast('Withdrawal processed', 'success') },
  })
  const mutReject = useMutation({
    mutationFn: ({ id, reason }) => rejectWithdrawal(id, reason),
    onSuccess: () => { qc.invalidateQueries(['admin-withdrawals']); showToast('Withdrawal rejected', 'success') },
  })

  const all = data?.data ?? []
  const pending   = all.filter((w) => w.status === 'pending')
  const history   = all.filter((w) => w.status !== 'pending')

  const rows = tab === 'pending' ? pending : history

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 border-b border-gray-200">
        {[
          { key: 'pending', label: 'Pending', count: pending.length },
          { key: 'history', label: 'History', count: history.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === key ? 'text-brand-600 border-b-2 border-brand-500 -mb-px' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                {count}
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
                {tab === 'pending'
                  ? ['User', 'Amount', 'Bank', 'Account', 'Requested', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))
                  : ['User', 'Amount', 'Bank', 'Account', 'Status', 'Processed', 'Reference'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={mockUser} size="sm" />
                      <span className="text-sm text-gray-700">{w.account_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatNaira(w.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{w.bank_name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{w.account_number}</td>
                  {tab === 'pending' ? (
                    <>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(w.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal({ type: 'process', id: w.id })}
                            className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                          >
                            Process
                          </button>
                          <button
                            onClick={() => setModal({ type: 'reject', id: w.id })}
                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{w.processed_at ? formatDate(w.processed_at) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{w.payment_reference ?? '—'}</td>
                    </>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No withdrawals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'process' && (
        <InputModal
          title="Enter Transaction Reference"
          placeholder="e.g. TRF-2026-001234"
          onConfirm={(ref) => { mutProcess.mutate({ id: modal.id, ref }); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'reject' && (
        <InputModal
          title="Rejection Reason"
          placeholder="e.g. Suspicious activity"
          onConfirm={(reason) => { mutReject.mutate({ id: modal.id, reason }); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
