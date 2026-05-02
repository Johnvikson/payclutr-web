import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck,
  Ban,
  Calendar,
  CreditCard,
  LogIn,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import {
  getAdminUsers,
  getAdminOrders,
  getAdminListings,
  banUser,
  unbanUser,
  awardBadge,
  revokeBadge,
} from '../../api/endpoints.js'
import { formatNaira, formatDate } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { orderRef } from '../../components/orders/OrderRow.jsx'

function fullName(user) {
  return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'User'
}

function roleTone(role) {
  return role === 'seller' ? 'bg-orange-50 text-brand ring-orange-100' : 'bg-gray-100 text-gray-600 ring-gray-200'
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center rounded-full ring-1 ring-inset px-2 py-0.5 text-[10px] font-medium capitalize ${roleTone(role)}`}>
      {role || 'buyer'}
    </span>
  )
}

function relativeTime(value) {
  if (!value) return '-'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return '-'
  const diff = Math.max(0, Date.now() - timestamp)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return 'Just now'
  if (diff < hour) {
    const count = Math.max(1, Math.floor(diff / minute))
    return `${count} minute${count === 1 ? '' : 's'} ago`
  }
  if (diff < day) {
    const count = Math.max(1, Math.floor(diff / hour))
    return `${count} hour${count === 1 ? '' : 's'} ago`
  }
  const count = Math.max(1, Math.floor(diff / day))
  return `${count} day${count === 1 ? '' : 's'} ago`
}

function displayLocation(user, compact = false) {
  const savedLocation = user.last_seen_location || ''
  if (savedLocation) return compact ? savedLocation.split(',')[0].trim() : savedLocation
  const place = user.city || user.state || ''
  if (!place) return '-'
  return compact ? place : `${place}, NG`
}

function UserDrawer({ user, onClose, onBan, onUnban, onAwardBadge, onRevokeBadge }) {
  const [tab, setTab] = useState('overview')

  const { data: ordersData } = useQuery({
    queryKey: ['admin-user-drawer-orders', user?.id],
    queryFn: () => getAdminOrders({ buyer: user.id }),
    enabled: !!user?.id,
  })
  const { data: listingsData } = useQuery({
    queryKey: ['admin-user-drawer-listings', user?.id],
    queryFn: () => getAdminListings({ seller: user.id }),
    enabled: !!user?.id,
  })

  if (!user) return null

  const orders = ordersData?.data ?? []
  const listings = listingsData?.data ?? []
  const userListings = listings.filter((listing) => String(listing.seller?.id) === String(user.id))
  const listingsCount = userListings.length
  const lastSeenTime = user.last_seen_at || user.last_login || user.updated_at || user.created_at
  const lastSeenLocation = displayLocation(user, true)
  const deviceLocation = displayLocation(user)
  const sessionRows = [
    ['Last seen', `${relativeTime(lastSeenTime)}${lastSeenLocation !== '-' ? ` \u00b7 ${lastSeenLocation}` : ''}`],
    ['Device', `${user.last_seen_device || 'Not captured yet'}${deviceLocation !== '-' ? ` \u00b7 ${deviceLocation}` : ''}`],
  ]
  const stats = [
    { label: 'Lifetime sales', value: formatNaira((Number(user.wallet_balance || 0) || 0) * 1.8) },
    { label: 'Orders', value: String((user.total_sales || 0) + (user.total_purchases || 0)) },
    { label: 'Disputes', value: String(user.dispute_count ?? 0) },
    { label: 'Listings', value: String(listingsCount) },
  ]
  const verificationItems = [
    { label: 'Email', status: user.email_verified ? 'verified' : 'pending', icon: Mail },
    { label: 'Phone', status: user.phone_verified ? 'verified' : 'pending', icon: Phone },
    { label: 'BVN', status: user.bvn_verified ? 'verified' : user.bvn ? 'pending' : 'rejected', icon: CreditCard },
    { label: 'NIN + Selfie', status: user.kyc_status, icon: ShieldCheck },
  ]
  const events = [
    { time: 'Recent', text: 'Account reviewed by admin', icon: LogIn },
    { time: formatDate(user.created_at), text: 'Account created', icon: UserPlus },
    ...(user.kyc_status === 'verified'
      ? [{ time: 'Verified', text: 'KYC verified by admin', icon: ShieldCheck }]
      : []),
  ]

  return (
    <>
      <button aria-label="Close user drawer overlay" onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="text-xs text-gray-500">User detail</div>
            <div className="text-sm font-mono text-gray-900">{user.uuid || user.id}</div>
          </div>
          <button className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <MessageCircle size={14} />
            Message
          </button>
          <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <MoreHorizontal size={15} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <UserAvatar user={user} size="2xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{fullName(user)}</h2>
                  {user.kyc_status === 'verified' && <BadgeCheck size={16} className="text-blue-500 shrink-0" />}
                </div>
                <div className="text-sm text-gray-500 mt-0.5 truncate">{user.email}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.kyc_status} />
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-200 px-2 py-0.5 text-[10px] font-medium">
                    <Calendar size={10} />
                    Joined {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="p-3 rounded-lg bg-gray-50">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">{stat.label}</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pt-2 border-b border-gray-100 flex gap-1">
            {['overview', 'orders', 'activity'].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={[
                  'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize',
                  tab === item ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900',
                ].join(' ')}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="px-6 py-5">
            {tab === 'overview' && (
              <div className="space-y-4">
                <section>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Account</div>
                  <div className="space-y-1.5">
                    {[
                      ['Phone', user.phone || '-'],
                      ['Wallet balance', formatNaira(user.wallet_balance || 0)],
                      ['Bank', user.virtual_account?.bank_name || '-'],
                      ...sessionRows,
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-gray-900 font-medium truncate ml-3">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Verification</div>
                  <div className="grid grid-cols-2 gap-2">
                    {verificationItems.map((item) => {
                      const VerificationIcon = item.icon

                      return (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <VerificationIcon size={14} className="text-gray-500" />
                            {item.label}
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Risk & limits</div>
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Risk score</span>
                      <span className="font-semibold text-emerald-600">Low · 12/100</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[12%] bg-emerald-500" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-500">Daily limit</div>
                        <div className="font-semibold text-gray-900 mt-0.5">{formatNaira(2000000)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Monthly limit</div>
                        <div className="font-semibold text-gray-900 mt-0.5">{formatNaira(20000000)}</div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-2">
                {orders.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <Package size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">{orderRef(order)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-gray-900 mt-0.5 truncate">{order.listing?.title || 'Untitled item'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{formatNaira(order.total_amount || order.item_price || 0)}</div>
                  </div>
                ))}
                {orders.length === 0 && <div className="text-sm text-gray-400 py-8 text-center">No orders found</div>}
              </div>
            )}

            {tab === 'activity' && (
              <div className="relative pl-5">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                {events.map((event) => {
                  const EventIcon = event.icon

                  return (
                    <div key={`${event.time}-${event.text}`} className="relative pb-4">
                      <div className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-300" />
                      <div className="text-[11px] text-gray-500">{event.time}</div>
                      <div className="text-sm text-gray-900 mt-0.5 flex items-center gap-2">
                        <EventIcon size={13} className="text-gray-500" />
                        {event.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${user.is_banned ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {user.is_banned ? 'Account suspended' : 'Account active'}
          </div>
          <div className="flex gap-2">
            {user.is_trusted_seller ? (
              <button onClick={() => onRevokeBadge(user)} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Revoke badge
              </button>
            ) : (
              <button onClick={() => onAwardBadge(user)} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Award badge
              </button>
            )}
            {user.is_banned ? (
              <button onClick={() => onUnban(user)} className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100">
                <Ban size={13} />
                Unsuspend
              </button>
            ) : (
              <button onClick={() => onBan(user)} className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100">
                <Ban size={13} />
                Suspend
              </button>
            )}
            <button disabled className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-red-600 text-white text-xs font-medium opacity-40 cursor-not-allowed">
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </footer>
      </aside>
    </>
  )
}

function ReasonModal({ title, placeholder, onConfirm, onClose }) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
        <textarea
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
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
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)

  const { data } = useQuery({
    queryKey: ['admin-users', search, kycFilter, roleFilter],
    queryFn: () => getAdminUsers({ search, kyc_status: kycFilter, role: roleFilter }),
  })

  const users = useMemo(() => data?.data ?? [], [data])
  const total = data?.total ?? users.length
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pageUsers = users.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  const mutBan = useMutation({
    mutationFn: ({ id, reason }) => banUser(id, reason),
    onSuccess: () => { invalidate(); showToast('User suspended', 'success') },
  })
  const mutUnban = useMutation({
    mutationFn: (id) => unbanUser(id),
    onSuccess: () => { invalidate(); showToast('User unsuspended', 'success') },
  })
  const mutAwardBadge = useMutation({
    mutationFn: (id) => awardBadge(id),
    onSuccess: () => { invalidate(); showToast('Trusted badge awarded', 'success') },
  })
  const mutRevokeBadge = useMutation({
    mutationFn: (id) => revokeBadge(id),
    onSuccess: () => { invalidate(); showToast('Trusted badge revoked', 'success') },
  })

  function visibleUser(user) {
    if (selected?.id !== user.id) return user
    return { ...selected, ...user }
  }

  return (
    <div className="px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <p className="text-sm text-gray-500 mt-0.5">Manage all PayClutr accounts.</p>

      <div className="mt-5 flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            placeholder="Search name or email"
            className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => { setRoleFilter(event.target.value); setPage(1) }}
          className="h-10 w-32 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={kycFilter}
          onChange={(event) => { setKycFilter(event.target.value); setPage(1) }}
          className="h-10 w-32 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none"
        >
          <option value="">All KYC</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left font-medium px-5 py-3">User</th>
                <th className="text-left font-medium px-5 py-3">Role</th>
                <th className="text-left font-medium px-5 py-3">KYC</th>
                <th className="text-left font-medium px-5 py-3">Wallet</th>
                <th className="text-left font-medium px-5 py-3">Joined</th>
                <th className="text-right font-medium px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((rawUser) => {
                const user = visibleUser(rawUser)

                return (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <div className="font-medium text-gray-900">{fullName(user)}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-5 py-3"><StatusBadge status={user.kyc_status} /></td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatNaira(user.wallet_balance || 0)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(user)}
                        className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {Math.min((page - 1) * PER_PAGE + 1, total)}-{Math.min(page * PER_PAGE, total)} of {total} users
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <UserDrawer
        key={selected?.id || 'empty'}
        user={selected}
        onClose={() => setSelected(null)}
        onBan={(user) => setModal({ type: 'ban', user })}
        onUnban={(user) => mutUnban.mutate(user.id)}
        onAwardBadge={(user) => mutAwardBadge.mutate(user.id)}
        onRevokeBadge={(user) => mutRevokeBadge.mutate(user.id)}
      />

      {modal?.type === 'ban' && (
        <ReasonModal
          title={`Suspend ${fullName(modal.user)}?`}
          placeholder="Reason for suspension..."
          onConfirm={(reason) => {
            mutBan.mutate({ id: modal.user.id, reason })
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
