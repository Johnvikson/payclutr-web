import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, MoreVertical } from 'lucide-react'
import { getAdminUsers, approveKyc, rejectKyc, banUser, unbanUser, awardBadge, revokeBadge } from '../../api/endpoints.js'
import { formatDate } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import TrustBadge from '../../components/ui/TrustBadge.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

function ActionDropdown({ user, onAction }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const items = [
    { label: 'View Profile', action: 'view' },
    ...(user.kyc_status === 'pending' ? [
      { label: 'Approve KYC', action: 'approve_kyc' },
      { label: 'Reject KYC', action: 'reject_kyc' },
    ] : []),
    ...(user.is_banned
      ? [{ label: 'Unban User', action: 'unban' }]
      : [{ label: 'Ban User', action: 'ban' }]
    ),
    ...(user.is_trusted_seller
      ? [{ label: 'Revoke Trusted Badge', action: 'revoke_badge' }]
      : [{ label: 'Award Trusted Badge', action: 'award_badge' }]
    ),
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} className="text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm">
          {items.map(({ label, action }) => (
            <button
              key={action}
              onClick={() => { onAction(action, user); setOpen(false) }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                action === 'ban' ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ReasonModal({ title, placeholder, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

const PER_PAGE = 10

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // { type, user }

  const { data } = useQuery({
    queryKey: ['admin-users', search, kycFilter, roleFilter],
    queryFn: () => getAdminUsers({ search, kyc_status: kycFilter, role: roleFilter }),
  })

  const mutApproveKyc  = useMutation({ mutationFn: (id) => approveKyc(id), onSuccess: () => { qc.invalidateQueries(['admin-users']); showToast('KYC approved', 'success') } })
  const mutRejectKyc   = useMutation({ mutationFn: ({ id, r }) => rejectKyc(id, r), onSuccess: () => { qc.invalidateQueries(['admin-users']); showToast('KYC rejected', 'success') } })
  const mutBan         = useMutation({ mutationFn: ({ id, r }) => banUser(id, r), onSuccess: () => { qc.invalidateQueries(['admin-users']); showToast('User banned', 'success') } })
  const mutUnban       = useMutation({ mutationFn: (id) => unbanUser(id), onSuccess: () => { qc.invalidateQueries(['admin-users']); showToast('User unbanned', 'success') } })

  const users = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pageUsers = users.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleAction = (action, user) => {
    if (action === 'view') return navigate(`/admin/users/${user.id}`)
    if (action === 'approve_kyc') return mutApproveKyc.mutate(user.id)
    if (action === 'reject_kyc') return setModal({ type: 'reject_kyc', user })
    if (action === 'ban') return setModal({ type: 'ban', user })
    if (action === 'unban') return mutUnban.mutate(user.id)
    if (action === 'award_badge') return showToast('Trusted badge awarded', 'success')
    if (action === 'revoke_badge') return showToast('Trusted badge revoked', 'success')
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{total}</span>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, email or phone..."
            className="h-10 w-full pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => { setKycFilter(e.target.value); setPage(1) }}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
        >
          <option value="">All KYC Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['User', 'KYC', 'Role', 'Trust Score', 'Sales', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.kyc_status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{user.role}</td>
                  <td className="px-4 py-3"><TrustBadge score={user.trust_score} isTrusted={user.is_trusted_seller} size="sm" /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.total_sales ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <ActionDropdown user={user} onAction={handleAction} />
                  </td>
                </tr>
              ))}
              {pageUsers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total} users</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
          >Previous</button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
          >Next</button>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'reject_kyc' && (
        <ReasonModal
          title={`Reject KYC for ${modal.user.first_name}?`}
          placeholder="Reason for rejection..."
          onConfirm={(r) => { mutRejectKyc.mutate({ id: modal.user.id, r }); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'ban' && (
        <ReasonModal
          title={`Ban ${modal.user.first_name}?`}
          placeholder="Reason for ban..."
          onConfirm={(r) => { mutBan.mutate({ id: modal.user.id, r }); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
