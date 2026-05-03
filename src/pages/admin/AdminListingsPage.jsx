import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Check, X } from 'lucide-react'
import {
  getAdminListings, adminDelistListing, adminApproveListing, adminRejectListing,
} from '../../api/endpoints.js'
import { formatNaira, formatDate, formatCondition } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

const PER_PAGE = 10

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'home_living', label: 'Home & Living' },
  { value: 'sports', label: 'Sports' },
  { value: 'books', label: 'Books' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'other', label: 'Other' },
]

const STATUSES = [
  { value: '',               label: 'All Statuses'   },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'active',         label: 'Active'         },
  { value: 'sold',           label: 'Sold'           },
  { value: 'delisted',       label: 'Removed'        },
]

export default function AdminListingsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', search, categoryFilter, statusFilter],
    queryFn: () => getAdminListings({ search, category: categoryFilter, status: statusFilter }),
  })

  const listings = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pageListings = listings.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const delistMutation = useMutation({
    mutationFn: (id) => adminDelistListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      showToast('Listing delisted', 'success')
    },
    onError: (err) => {
      showToast(err?.detail ?? 'Failed to delist listing', 'error')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminApproveListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      showToast('Listing approved — now live', 'success')
    },
    onError: (err) => {
      showToast(err?.detail ?? 'Failed to approve listing', 'error')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminRejectListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      showToast('Listing rejected', 'success')
    },
    onError: (err) => {
      showToast(err?.detail ?? 'Failed to reject listing', 'error')
    },
  })

  function handleDelist(e, id) {
    e.stopPropagation()
    delistMutation.mutate(id)
  }

  function handleApprove(e, id) {
    e.stopPropagation()
    approveMutation.mutate(id)
  }

  function handleReject(e, id) {
    e.stopPropagation()
    const reason = window.prompt('Reason for rejection (optional, shown to seller):') ?? ''
    rejectMutation.mutate({ id, reason: reason.trim() })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{total}</span>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by title or seller..."
            className="h-10 w-full pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Thumbnail', 'Title', 'Seller', 'Price', 'Condition', 'Receipt', 'Category', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!isLoading && pageListings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0].image_url || listing.images[0]}
                        alt={listing.title}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                    )}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-[180px] truncate font-medium">
                    {listing.title}
                  </td>

                  {/* Seller */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar user={listing.seller} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 truncate">
                          {listing.seller?.first_name} {listing.seller?.last_name}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {listing.seller?.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatNaira(listing.price)}
                  </td>

                  {/* Condition */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {formatCondition(listing.condition)}
                    </span>
                    <div className="mt-1 text-[11px] text-gray-500 max-w-[160px] line-clamp-2">
                      Defects: {listing.defects || 'None'}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {listing.receipt_url ? (
                      <a
                        href={listing.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand hover:underline"
                      >
                        View receipt
                      </a>
                    ) : (
                      <span className={listing.category === 'Electronics' ? 'text-red-600 font-medium' : 'text-gray-400'}>
                        Missing
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">
                    {listing.category?.replace(/_/g, ' ')}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(listing.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {listing.status === 'pending_review' && (
                        <>
                          <button
                            onClick={(e) => handleApprove(e, listing.id)}
                            disabled={approveMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={(e) => handleReject(e, listing.id)}
                            disabled={rejectMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}
                      {listing.status === 'active' && (
                        <button
                          onClick={(e) => handleDelist(e, listing.id)}
                          disabled={delistMutation.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          Delist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && pageListings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                    No listings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>
          {total === 0
            ? 'No listings'
            : `Showing ${Math.min((page - 1) * PER_PAGE + 1, total)}–${Math.min(page * PER_PAGE, total)} of ${total} listings`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
