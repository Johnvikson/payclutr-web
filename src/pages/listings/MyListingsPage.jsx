import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Edit2, Trash2, RotateCcw, Package, Calendar, TrendingUp } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import { getMyListings, deleteListing, updateListing } from '../../api/endpoints.js'
import { formatNaira, formatDate } from '../../utils/formatters.js'

const TABS = [
  { key: 'active',   label: 'Active' },
  { key: 'sold',     label: 'Sold' },
  { key: 'delisted', label: 'Delisted' },
]

const CONDITION_DOT = {
  excellent: 'bg-green-500',
  very_good: 'bg-blue-500',
  good:      'bg-amber-400',
  fair:      'bg-gray-400',
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl mb-2 animate-pulse">
      <div className="w-14 h-14 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-2/3" />
        <div className="h-3.5 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

function ListingRow({ listing, tab, onDelist, onRelist }) {
  const navigate = useNavigate()
  const img = listing.images?.[0]?.image_url
  const dot = CONDITION_DOT[listing.condition] || 'bg-gray-400'

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border border-gray-100 rounded-xl mb-2 bg-white hover:border-gray-200 transition-colors">
      <div
        className="relative w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/listings/${listing.id}`)}
      >
        {img ? (
          <img src={img} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        <span className={`absolute top-1 left-1 w-2 h-2 rounded-full ${dot} ring-1 ring-white`} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-brand-600 transition-colors"
          onClick={() => navigate(`/listings/${listing.id}`)}
        >
          {listing.title}
        </p>
        <p className="text-sm font-semibold text-brand-600 mt-0.5">{formatNaira(listing.price)}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={11} />
            {formatDate(listing.created_at)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={11} />
            {listing.views_count} views
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        {tab === 'active' && (
          <>
            <Link
              to={`/listings/${listing.id}/edit`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Edit2 size={12} />
              Edit
            </Link>
            <button
              onClick={onDelist}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={12} />
              Delist
            </button>
          </>
        )}
        {tab === 'sold' && (
          <Link
            to="/orders"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Package size={12} />
            View Order
          </Link>
        )}
        {tab === 'delisted' && (
          <button
            onClick={onRelist}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw size={11} />
            Relist
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyListingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [delistTarget, setDelistTarget] = useState(null)
  const [relistTarget, setRelistTarget] = useState(null)

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: getMyListings,
  })

  const byStatus = {
    active:   listings.filter((l) => l.status === 'active'),
    sold:     listings.filter((l) => l.status === 'sold'),
    delisted: listings.filter((l) => l.status === 'delisted'),
  }

  const delistMutation = useMutation({
    mutationFn: (id) => deleteListing(id),
    onSuccess: () => { queryClient.invalidateQueries(['my-listings']); setDelistTarget(null) },
  })

  const relistMutation = useMutation({
    mutationFn: (id) => updateListing(id, { status: 'active' }),
    onSuccess: () => { queryClient.invalidateQueries(['my-listings']); setRelistTarget(null) },
  })

  const current = byStatus[activeTab] || []
  const totalValue = byStatus.active.reduce((sum, l) => sum + (l.price || 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your items for sale</p>
        </div>
        <Link
          to="/listings/create"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map(({ key, label }) => {
          const count = byStatus[key]?.length || 0
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative pb-3 px-1 mr-5 text-sm font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {label}
              {!isLoading && count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)
        ) : current.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {activeTab === 'active' ? 'No active listings' : activeTab === 'sold' ? 'No sold items yet' : 'No delisted items'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === 'active' ? 'Items you list will appear here' : 'They will appear here when ready'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => navigate('/listings/create')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
              >
                <Plus size={14} />
                List your first item
              </button>
            )}
          </div>
        ) : (
          current.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              tab={activeTab}
              onDelist={() => setDelistTarget(listing)}
              onRelist={() => setRelistTarget(listing)}
            />
          ))
        )}
      </div>

      {/* Stats bar */}
      {!isLoading && (
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total value</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">{formatNaira(totalValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Store health</p>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-sm font-medium text-green-600">Excellent</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            <TrendingUp size={14} />
            Insights
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!delistTarget}
        onClose={() => setDelistTarget(null)}
        onConfirm={() => delistMutation.mutate(delistTarget?.id)}
        title="Delist this item?"
        message={`"${delistTarget?.title}" will be removed from the marketplace. You can relist it later.`}
        confirmLabel="Delist"
        confirmVariant="danger"
        isLoading={delistMutation.isPending}
      />
      <ConfirmModal
        isOpen={!!relistTarget}
        onClose={() => setRelistTarget(null)}
        onConfirm={() => relistMutation.mutate(relistTarget?.id)}
        title="Relist this item?"
        message={`"${relistTarget?.title}" will be visible to buyers again.`}
        confirmLabel="Relist"
        confirmVariant="primary"
        isLoading={relistMutation.isPending}
      />
    </div>
  )
}
