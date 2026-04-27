import { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Zap, Tag, Home, Settings, Heart, BookOpen, Activity, Truck, Grid,
  SlidersHorizontal, X, ChevronLeft, ChevronRight, Inbox,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getListings } from '../../api/endpoints.js'
import { NIGERIAN_STATES } from '../../utils/constants.js'
import ListingCard from '../../components/listings/ListingCard.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import Button from '../../components/ui/Button.jsx'
import { TextInput, Select, Checkbox } from '../../components/ui/Field.jsx'

const CATEGORIES = [
  { id: '',                          label: 'All',         icon: Grid     },
  { id: 'Electronics',               label: 'Electronics', icon: Zap      },
  { id: 'Fashion & Accessories',     label: 'Fashion',     icon: Tag      },
  { id: 'Furniture',                 label: 'Furniture',   icon: Home     },
  { id: 'Home Appliances',           label: 'Appliances',  icon: Settings },
  { id: 'Baby & Kids Items',         label: 'Baby & Kids', icon: Heart    },
  { id: 'Books & Media',             label: 'Books',       icon: BookOpen },
  { id: 'Sports & Fitness',          label: 'Sports',      icon: Activity },
  { id: 'Vehicles & Parts',          label: 'Vehicles',    icon: Truck    },
  { id: 'Others',                    label: 'Others',      icon: Grid     },
]

const CONDITIONS = [
  { key: 'excellent', label: 'Excellent' },
  { key: 'very_good', label: 'Very Good' },
  { key: 'good',      label: 'Good' },
  { key: 'fair',      label: 'Fair' },
]

const SHIPPING_OPTIONS = [
  { key: 'park_waybill', field: 'shipping_park',         label: 'Park Waybill' },
  { key: 'gig',          field: 'shipping_gig',          label: 'GIG Logistics' },
  { key: 'bolt_indrive', field: 'shipping_bolt_indrive', label: 'Bolt / InDrive' },
  { key: 'local_pickup', field: 'shipping_pickup',       label: 'Local Pickup' },
]

const SORT_OPTIONS = [
  { key: 'newest',     label: 'Newest' },
  { key: 'price_asc',  label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'most_viewed', label: 'Most viewed' },
]

const EMPTY_FILTERS = { conditions: [], state: '', priceMin: '', priceMax: '', shipping: [] }
const PER_PAGE = 12

function CategoryPill({ cat, active, onClick }) {
  const Icon = cat.icon
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-brand text-white border-brand'
          : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
      }`}
    >
      <Icon size={13} />
      {cat.label}
    </button>
  )
}

function FiltersPanel({ filters, setFilters }) {
  const update = (k, v) => setFilters({ ...filters, [k]: v })
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-semibold text-gray-800 dark:text-zinc-200 uppercase tracking-wider mb-3">Condition</h4>
        <div className="space-y-2">
          {CONDITIONS.map(({ key, label }) => (
            <Checkbox
              key={key}
              checked={filters.conditions.includes(key)}
              label={label}
              onChange={(v) => update('conditions', v ? [...filters.conditions, key] : filters.conditions.filter(x => x !== key))}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-800 dark:text-zinc-200 uppercase tracking-wider mb-3">State</h4>
        <Select value={filters.state} onChange={(e) => update('state', e.target.value)}>
          <option value="">All states</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-800 dark:text-zinc-200 uppercase tracking-wider mb-3">Price range</h4>
        <div className="flex items-center gap-2">
          <TextInput
            prefix="₦"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => update('priceMin', e.target.value.replace(/\D/g, ''))}
          />
          <span className="text-gray-400">–</span>
          <TextInput
            prefix="₦"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => update('priceMax', e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-800 dark:text-zinc-200 uppercase tracking-wider mb-3">Shipping</h4>
        <div className="space-y-2">
          {SHIPPING_OPTIONS.map(({ key, label }) => (
            <Checkbox
              key={key}
              checked={filters.shipping.includes(key)}
              label={label}
              onChange={(v) => update('shipping', v ? [...filters.shipping, key] : filters.shipping.filter(x => x !== key))}
            />
          ))}
        </div>
      </div>

      <Button variant="secondary" full onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>
    </div>
  )
}

export default function BrowsePage() {
  const ctx = useOutletContext() ?? {}
  const search = ctx.search ?? ''
  const setSearch = ctx.setSearch ?? (() => {})

  const [category, setCategory] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: getListings,
  })
  const all = data?.data || []

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, category, filters, sort])

  const filtered = useMemo(() => {
    let r = [...all]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((l) =>
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q),
      )
    }
    if (category) r = r.filter((l) => l.category === category)
    if (filters.conditions.length) r = r.filter((l) => filters.conditions.includes(l.condition))
    if (filters.state) r = r.filter((l) => l.state === filters.state)
    if (filters.priceMin) r = r.filter((l) => l.price >= Number(filters.priceMin) * 100)
    if (filters.priceMax) r = r.filter((l) => l.price <= Number(filters.priceMax) * 100)
    if (filters.shipping.length) {
      const fieldMap = Object.fromEntries(SHIPPING_OPTIONS.map((s) => [s.key, s.field]))
      r = r.filter((l) => filters.shipping.some((m) => l[fieldMap[m]]))
    }
    switch (sort) {
      case 'price_asc':   r.sort((a, b) => a.price - b.price); break
      case 'price_desc':  r.sort((a, b) => b.price - a.price); break
      case 'most_viewed': r.sort((a, b) => (b.views_count || 0) - (a.views_count || 0)); break
      default:            r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return r
  }, [all, search, category, filters, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)]">
      {/* Mobile search (top of content, since navbar search is desktop-only) */}
      <div className="lg:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for anything…"
          className="w-full h-9 px-3 text-sm rounded-lg bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-gray-200 dark:focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-colors"
        />
      </div>

      {/* Categories — sticky just under navbar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-14 z-20">
        <div className="px-4 lg:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.id || 'all'}
              cat={c}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <FiltersPanel filters={filters} setFilters={setFilters} />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Top row: count + filters/sort */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-500 dark:text-zinc-500">
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{filtered.length}</span> items found
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={SlidersHorizontal}
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden"
              >
                Filters
              </Button>
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="!h-8 !text-xs !w-auto pr-8">
                {SORT_OPTIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </Select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 mb-3">
                <Inbox size={24} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">No listings match your filters</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-xs">Try removing some filters or searching for something else.</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => { setFilters(EMPTY_FILTERS); setSearch(''); setCategory('') }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {paged.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 inline-flex items-center justify-center"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const n = i + 1
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium inline-flex items-center justify-center ${
                      page === n
                        ? 'bg-brand text-white'
                        : 'border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-xs text-gray-400 dark:text-zinc-600 px-1">…</span>
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium inline-flex items-center justify-center ${
                      page === totalPages
                        ? 'bg-brand text-white'
                        : 'border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 inline-flex items-center justify-center"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[85vh] overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <FiltersPanel filters={filters} setFilters={setFilters} />
              <Button full className="mt-4" onClick={() => setDrawerOpen(false)}>Apply filters</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
