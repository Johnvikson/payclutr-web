import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Inbox, X } from 'lucide-react'
import { getAdminUsers, approveKyc, rejectKyc } from '../../api/endpoints.js'
import { formatDate } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
]

const DOCUMENT_LABELS = {
  nin_slip: 'NIN slip',
  national_id: 'National ID card',
  voters_card: "Voter's card",
  drivers_license: "Driver's license",
  international_passport: 'International passport',
}

function fullName(user) {
  return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'User'
}

function documentLabel(user) {
  return DOCUMENT_LABELS[user?.id_document_type] || 'No ID type'
}

function ImageLink({ href, label, user }) {
  if (!href) {
    return (
      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-[9px] text-gray-400">
        None
      </div>
    )
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block w-10 h-10">
      <img
        src={href}
        alt={`${fullName(user)} ${label}`}
        className="w-10 h-10 rounded object-cover hover:ring-2 hover:ring-brand-500"
      />
    </a>
  )
}

function EmptyState({ tab }) {
  return (
    <div className="py-14 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-300">
        <Inbox size={22} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">No {tab} submissions</h3>
      <p className="text-xs text-gray-500 mt-1">The queue is clear.</p>
    </div>
  )
}

function RejectModal({ user, loading, onConfirm, onClose }) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Reject KYC submission</h3>
          <p className="text-xs text-gray-500 mt-1">
            The user will see this message for {fullName(user)}.
          </p>
        </div>

        <div className="p-5">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Reason for rejection</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. ID document is blurry or selfie does not match. Please retake in good lighting."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Rejecting...' : 'Reject submission'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminKYCPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [tab, setTab] = useState('pending')
  const [rejectTarget, setRejectTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers({}),
  })
  const users = data?.data ?? []
  const filtered = users.filter((user) => user.kyc_status === tab)

  const approveMutation = useMutation({
    mutationFn: (id) => approveKyc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      showToast('KYC approved', 'success')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectKyc(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      showToast('KYC rejected', 'success')
    },
  })

  const counts = TABS.reduce((acc, { key }) => ({
    ...acc,
    [key]: users.filter((user) => user.kyc_status === key).length,
  }), {})

  function handleReject(reason) {
    if (!rejectTarget) return
    rejectMutation.mutate(
      { id: rejectTarget.id, reason },
      { onSuccess: () => setRejectTarget(null) },
    )
  }

  return (
    <div className="px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900">KYC review queue</h1>
      <p className="text-sm text-gray-500 mt-0.5">
        Approve or reject identity verification submissions.
      </p>

      <div className="mt-5 border-b border-gray-200 flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900',
            ].join(' ')}
          >
            {label}
            <span className="ml-1 text-[11px] text-gray-400">{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left font-medium px-5 py-3">User</th>
                <th className="text-left font-medium px-5 py-3">Email</th>
                <th className="text-left font-medium px-5 py-3">ID type</th>
                <th className="text-left font-medium px-5 py-3">Documents</th>
                <th className="text-left font-medium px-5 py-3">Submitted</th>
                <th className="text-right font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="sm" />
                      <span className="font-medium text-gray-900 whitespace-nowrap">{fullName(user)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <div className="text-xs font-medium text-gray-700 whitespace-nowrap">{documentLabel(user)}</div>
                    {user.nin && <div className="mt-0.5 font-mono text-[11px] text-gray-400">{user.nin}</div>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ImageLink href={user.id_front_url} label="ID front" user={user} />
                      <ImageLink href={user.id_back_url} label="ID back" user={user} />
                      <ImageLink href={user.selfie_url} label="selfie" user={user} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(user.kyc_submitted_at ?? user.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {tab === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(user.id)}
                            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Check size={14} className="text-emerald-600" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectTarget(user)}
                            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <X size={14} className="text-red-500" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <StatusBadge status={user.kyc_status} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length === 0 && <EmptyState tab={tab} />}
        {isLoading && (
          <div className="py-14 text-center text-sm text-gray-400">Loading KYC submissions...</div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          user={rejectTarget}
          loading={rejectMutation.isPending}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
