import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, RotateCcw, Package, MoreVertical, Eye,
} from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import { getMyListings, deleteListing, updateListing } from '../../api/endpoints.js'
import { formatNaira, formatDate, formatCondition } from '../../utils/formatters.js'

import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'

const TABS = [
  { key: 'active',         label: 'Active'         },
  { key: 'sold',           label: 'Sold'           },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'delisted',       label: 'Delisted'       },
]

const STATUS_TONE = {
  active:         'active',
  sold:           'completed',
  pending_review: 'pending',
  delisted:       'gray',
  draft:          'pending',
}

const STATUS_LABEL = {
  active:         'Active',
  sold:           'Sold',
  pending_review: 'Pending review',
  delisted:       'Delisted',
  draft:          'Draft',
}

// ─── Skeletons ──────────────────────────────────────────────────────────────
function MobileRowSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-3 flex gap-3 animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-t border-gray-100 dark:border-zinc-800 animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-40" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded-full w-16" /></td>
      <td className="px-4 py-3"><div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-8" /></td>
      <td className="px-4 py-3"><div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-20" /></td>
      <td className="px-4 py-3" />
    </tr>
  )
}

// ─── Mobile row card ───────────────────────────────────────────────────────
function MobileListingRow({ listing, tab, onEdit, onDelist, onRelist }) {
  const navigate = useNavigate()
  const img = listing.images?.[0]?.image_url
  const tone = STATUS_TONE[listing.status] || 'gray'
  const label = STATUS_LABEL[listing.status] || listing.status

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-3 flex gap-3">
      <button
        type="button"
        onClick={() => navigate(`/listings/${listing.id}`)}
        className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0 overflow-hidden"
      >
        {img ? (
          <img src={img} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => navigate(`/listings/${listing.id}`)}
          className="block text-left w-full"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 line-clamp-1">
            {listing.title}
          </div>
          <div className="text-sm font-bold text-brand mt-0.5">
            {formatNaira(listing.price)}
          </div>
        </button>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <Badge tone={tone} size="xs">{label}</Badge>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-500">
            <Eye size={11} /> {listing.views_count || 0} views
          </span>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3">
          {(tab === 'active' || tab === 'pending_review') && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-100"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={onDelist}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
              >
                <Trash2 size={12} /> {tab === 'pending_review' ? 'Withdraw' : 'Delist'}
              </button>
            </>
          )}
          {tab === 'sold' && (
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Package size={12} /> View order
            </Link>
          )}
          {tab === 'delisted' && (
            <button
              onClick={onRelist}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <RotateCcw size={11} /> Relist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Desktop table row ──────────────────────────────────────────────────────
function TableRow({ listing, tab, onEdit, onDelist, onRelist }) {
  const navigate = useNavigate()
  const img = listing.images?.[0]?.image_url
  const tone = STATUS_TONE[listing.status] || 'gray'
  const label = STATUS_LABEL[listing.status] || listing.status

  return (
    <tr className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(`/listings/${listing.id}`)}
          className="flex items-center gap-3 text-left w-full"
        >
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0">
            {img ? (
              <img src={img} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-zinc-100 line-clamp-1">{listing.title}</div>
            <div className="text-xs text-gray-500 dark:text-zinc-500">{formatCondition(listing.condition)}</div>
          </div>
        </button>
      </td>
      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
        {formatNaira(listing.price)}
      </td>
      <td className="px-4 py-3">
        <Badge tone={tone}>{label}</Badge>
      </td>
      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{listing.views_count || 0}</td>
      <td className="px-4 py-3 text-gray-500 dark:text-zinc-500 whitespace-nowrap">
        {formatDate(listing.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {(tab === 'active' || tab === 'pending_review') && (
            <>
              <button
                onClick={onEdit}
                title="Edit"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={onDelist}
                title={tab === 'pending_review' ? 'Withdraw submission' : 'Delist'}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          {tab === 'sold' && (
            <Link
              to="/orders"
              className="text-xs font-medium text-brand hover:underline"
            >
              View order
            </Link>
          )}
          {tab === 'delisted' && (
            <button
              onClick={onRelist}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-brand text-white text-xs font-medium hover:bg-[color:var(--brand-700)] transition-colors"
            >
              <RotateCcw size={11} /> Relist
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function MyListingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('active')
  const [delistTarget, setDelistTarget] = useState(null)
  const [relistTarget, setRelistTarget] = useState(null)

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: getMyListings,
  })

  const byStatus = {
    active:         listings.filter((l) => l.status === 'active'),
    sold:           listings.filter((l) => l.status === 'sold'),
    pending_review: listings.filter((l) => l.status === 'pending_review'),
    delisted:       listings.filter((l) => l.status === 'delisted'),
  }

  const delistMutation = useMutation({
    mutationFn: (id) => deleteListing(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); setDelistTarget(null) },
  })

  const relistMutation = useMutation({
    mutationFn: (id) => updateListing(id, { status: 'active' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); setRelistTarget(null) },
  })

  const current = byStatus[activeTab] || []

  const emptyState = {
    active:         { title: 'No active listings',     body: 'Items you list will appear here.', cta: true  },
    sold:           { title: 'No sold items yet',      body: 'When buyers purchase your items, they appear here.', cta: false },
    pending_review: { title: 'No listings under review', body: 'Listings awaiting admin approval appear here.', cta: false },
    delisted:       { title: 'No delisted items',      body: 'Items you delist appear here. You can relist them anytime.', cta: false },
  }[activeTab]

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)]">
      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">My listings</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
              Manage everything you're selling on PayClutr.
            </p>
          </div>
          <Link to="/listings/create" className="hidden sm:block">
            <Button icon={Plus}>List item</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-zinc-800 flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, label }) => {
            const count = byStatus[key]?.length || 0
            const active = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  active
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                {label}
                {!isLoading && (
                  <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-orange-50 text-brand dark:bg-orange-900/20'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <>
            {/* Mobile skeletons */}
            <div className="mt-4 space-y-3 lg:hidden">
              {Array.from({ length: 3 }).map((_, i) => <MobileRowSkeleton key={i} />)}
            </div>
            {/* Desktop skeleton table */}
            <div className="mt-4 hidden lg:block bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs text-gray-500 dark:text-zinc-500">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Item</th>
                    <th className="text-left font-medium px-4 py-3">Price</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Views</th>
                    <th className="text-left font-medium px-4 py-3">Listed</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)}
                </tbody>
              </table>
            </div>
          </>
        ) : current.length === 0 ? (
          <div className="mt-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
            <div className="flex flex-col items-center justify-center text-center py-14 px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 mb-3">
                <Package size={22} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">{emptyState.title}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-xs">{emptyState.body}</p>
              {emptyState.cta && (
                <Button
                  className="mt-4"
                  icon={Plus}
                  onClick={() => navigate('/listings/create')}
                >
                  List your first item
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="mt-4 space-y-3 lg:hidden">
              {current.map((l) => (
                <MobileListingRow
                  key={l.id}
                  listing={l}
                  tab={activeTab}
                  onEdit={() => navigate(`/listings/${l.id}/edit`)}
                  onDelist={() => setDelistTarget(l)}
                  onRelist={() => setRelistTarget(l)}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-4 hidden lg:block bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs text-gray-500 dark:text-zinc-500">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Item</th>
                    <th className="text-left font-medium px-4 py-3">Price</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Views</th>
                    <th className="text-left font-medium px-4 py-3">Listed</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((l) => (
                    <TableRow
                      key={l.id}
                      listing={l}
                      tab={activeTab}
                      onEdit={() => navigate(`/listings/${l.id}/edit`)}
                      onDelist={() => setDelistTarget(l)}
                      onRelist={() => setRelistTarget(l)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delist confirm */}
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
      {/* Relist confirm */}
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
