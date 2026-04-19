import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, approveKyc, rejectKyc } from '../../api/endpoints.js'
import { formatDate } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

function ReasonModal({ title, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >Reject</button>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'pending',  label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
]

export default function AdminKYCPage() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [tab, setTab] = useState('pending')
  const [rejectTarget, setRejectTarget] = useState(null)

  const { data } = useQuery({ queryKey: ['admin-users'], queryFn: () => getAdminUsers({}) })
  const users = data?.data ?? []

  const filtered = users.filter((u) => u.kyc_status === tab)

  const mutApprove = useMutation({
    mutationFn: (id) => approveKyc(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); showToast('KYC approved', 'success') },
  })
  const mutReject = useMutation({
    mutationFn: ({ id, reason }) => rejectKyc(id, reason),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); showToast('KYC rejected', 'success') },
  })

  const counts = TABS.reduce((acc, { key }) => ({
    ...acc,
    [key]: users.filter((u) => u.kyc_status === key).length,
  }), {})

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">KYC Review</h1>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === key ? 'text-brand-600 border-b-2 border-brand-500 -mb-px' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Submissions */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">No {tab} KYC submissions</p>
          </div>
        )}
        {filtered.map((user) => (
          <div key={user.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            {/* Avatar */}
            <UserAvatar user={user} size="lg" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={user.kyc_status} />
                <span className="text-xs text-gray-400">Submitted {formatDate(user.created_at)}</span>
              </div>
            </div>

            {/* BVN/NIN type badge */}
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
              BVN
            </span>

            {/* Selfie placeholder */}
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[10px] text-gray-400 text-center leading-tight">No<br/>photo</span>
            </div>

            {/* Actions */}
            {tab === 'pending' && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => mutApprove.mutate(user.id)}
                  className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => setRejectTarget(user)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <ReasonModal
          title={`Reject KYC for ${rejectTarget.first_name}?`}
          onConfirm={(reason) => {
            mutReject.mutate({ id: rejectTarget.id, reason })
            setRejectTarget(null)
          }}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
