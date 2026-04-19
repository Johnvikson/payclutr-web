import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import { getUserProfile, approveKyc, rejectKyc, banUser, unbanUser, getOrders, getMyListings } from '../../api/endpoints.js'
import { formatNaira, formatDate } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import TrustBadge from '../../components/ui/TrustBadge.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

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
          >Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [tab, setTab] = useState('orders')
  const [modal, setModal] = useState(null)

  const { data: user } = useQuery({ queryKey: ['admin-user', id], queryFn: () => getUserProfile(id) })
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const { data: listings = [] } = useQuery({ queryKey: ['my-listings'], queryFn: getMyListings })

  const mutApprove = useMutation({ mutationFn: () => approveKyc(id), onSuccess: () => { qc.invalidateQueries(['admin-user', id]); showToast('KYC approved', 'success') } })
  const mutReject  = useMutation({ mutationFn: (r) => rejectKyc(id, r), onSuccess: () => { qc.invalidateQueries(['admin-user', id]); showToast('KYC rejected', 'success') } })
  const mutBan     = useMutation({ mutationFn: (r) => banUser(id, r), onSuccess: () => { qc.invalidateQueries(['admin-user', id]); showToast('User banned', 'success') } })
  const mutUnban   = useMutation({ mutationFn: () => unbanUser(id), onSuccess: () => { qc.invalidateQueries(['admin-user', id]); showToast('User unbanned', 'success') } })

  if (!user) return null

  const stats = [
    { label: 'Total Sales',      value: user.total_sales ?? 0 },
    { label: 'Total Purchases',  value: user.total_purchases ?? 0 },
    { label: 'Disputes',         value: user.dispute_count ?? 0 },
    { label: 'Wallet Balance',   value: formatNaira(user.wallet_balance ?? 0) },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex flex-col items-center text-center gap-2">
              <UserAvatar user={user} size="2xl" />
              <h2 className="text-xl font-semibold text-gray-900 mt-1">{user.first_name} {user.last_name}</h2>
              <TrustBadge score={user.trust_score} isTrusted={user.is_trusted_seller} />
              <StatusBadge status={user.kyc_status} />
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">{user.role}</span>
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              {user.state && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={13} />
                  {user.city}, {user.state}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={13} />
                Joined {formatDate(user.created_at)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            {user.kyc_status === 'pending' && (
              <>
                <button
                  onClick={() => mutApprove.mutate()}
                  className="w-full py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  Approve KYC
                </button>
                <button
                  onClick={() => setModal('reject_kyc')}
                  className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Reject KYC
                </button>
              </>
            )}
            {user.is_banned ? (
              <button
                onClick={() => mutUnban.mutate()}
                className="w-full py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
              >
                Unban User
              </button>
            ) : (
              <button
                onClick={() => setModal('ban')}
                className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Ban User
              </button>
            )}
            {user.is_trusted_seller ? (
              <button
                onClick={() => showToast('Trusted badge revoked', 'success')}
                className="w-full py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Revoke Trusted Badge
              </button>
            ) : (
              <button
                onClick={() => showToast('Trusted badge awarded', 'success')}
                className="w-full py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Award Trusted Badge
              </button>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {['orders', 'listings'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? 'text-brand-600 border-b-2 border-brand-500'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {tab === 'orders' && (
                orders.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">No orders</p>
                ) : (
                  orders.slice(0, 6).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.listing?.title}</p>
                        <p className="text-xs text-gray-400">{order.uuid}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatNaira(order.item_price)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))
                )
              )}
              {tab === 'listings' && (
                listings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">No listings</p>
                ) : (
                  listings.slice(0, 6).map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                        <p className="text-xs text-gray-400">{listing.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-600">{formatNaira(listing.price)}</p>
                        <StatusBadge status={listing.status} />
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'reject_kyc' && (
        <ReasonModal
          title="Reject KYC?"
          placeholder="Reason for rejection..."
          onConfirm={(r) => { mutReject.mutate(r); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'ban' && (
        <ReasonModal
          title="Ban this user?"
          placeholder="Reason for ban..."
          onConfirm={(r) => { mutBan.mutate(r); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
