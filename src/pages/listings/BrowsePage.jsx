import { useState, useRef, useMemo, useCallback } from 'react'
import {
  Search, SlidersHorizontal, X,
  Zap, Tag, Home, Settings, Heart, BookOpen, Activity, Truck, Grid,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import BrowseNav from '../../components/listings/BrowseNav.jsx'
import ListingCard from '../../components/listings/ListingCard.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import { getListings } from '../../api/endpoints.js'
import { NIGERIAN_STATES } from '../../utils/constants.js'

const HERO_CATEGORIES = [
  { key: 'Electronics',           label: 'Electronics', icon: Zap },
  { key: 'Fashion & Accessories', label: 'Fashion',     icon: Tag },
  { key: 'Furniture',             label: 'Furniture',   icon: Home },
  { key: 'Home Appliances',       label: 'Appliances',  icon: Settings },
  { key: 'Baby & Kids Items',     label: 'Baby & Kids', icon: Heart },
  { key: 'Books & Media',         label: 'Books',       icon: BookOpen },
  { key: 'Sports & Fitness',      label: 'Sports',      icon: Activity },
  { key: 'Vehicles & Parts',      label: 'Vehicles',    icon: Truck },
  { key: 'Others',                label: 'Others',      icon: Grid },
]

const CONDITIONS = [
  { key: 'excellent', label: 'Excellent' },
  { key: 'very_good', label: 'Very Good' },
  { key: 'good',      label: 'Good' },
  { key: 'fair',      label: 'Fair' },
]

const SHIPPING_OPTIONS = [
  { key: 'park_waybill',   field: 'shipping_park',         label: 'Park Waybill' },
  { key: 'gig',            field: 'shipping_gig',          label: 'GIG Logistics' },
  { key: 'bolt_indrive',   field: 'shipping_bolt_indrive', label: 'Bolt / InDrive' },
  { key: 'local_pickup',   field: 'shipping_pickup',       label: 'Local Pickup' },
]

const SORT_OPTIONS = [
  { key: 'newest',      label: 'Newest First' },
  { key: 'price_asc',  label: 'Price: Low → High' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'most_viewed', label: 'Most Viewed' },
]

const EMPTY_FILTERS = { conditions: [], state: '', priceMin: '', priceMax: '', shipping: [] }
const PER_PAGE = 12

function FilterSidebar({ filters, setFilters, activeCategory, setActiveCategory }) {
  const hasAny = filters.conditions.length || filters.state || filters.priceMin ||
    filters.priceMax || filters.shipping.length || activeCategory

  function toggleArr(key, val) {
    setFilters((p) => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter((x) => x !== val) : [...p[key], val],
    }))
  }

  return (
    <div className="w-56 flex-shrink-0">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-semibold text-gray-900">Filters</span>
        {hasAny && (
          <button
            onClick={() => { setFilters(EMPTY_FILTERS); setActiveCategory('') }}
            className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Condition</p>
        <div className="space-y-2">
          {CONDITIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={filters.conditions.includes(key)}
                onChange={() => toggleArr('conditions', key)}
                className="w-3.5 h-3.5 accent-brand-600 rounded"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">State</p>
        <select
          value={filters.state}
          onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="">All States</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Range (₦)</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1.5">Min</p>
            <input
              type="number"
              placeholder="0"
              value={filters.priceMin}
              onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1.5">Max</p>
            <input
              type="number"
              placeholder="Any"
              value={filters.priceMax}
              onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Shipping</p>
        <div className="space-y-2">
          {SHIPPING_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={filters.shipping.includes(key)}
                onChange={() => toggleArr('shipping', key)}
                className="w-3.5 h-3.5 accent-brand-600 rounded"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchTimeout = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: getListings,
  })
  const allListings = data?.data || []

  const handleSearchInput = useCallback((val) => {
    setSearchInput(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setSearch(val); setPage(1) }, 400)
  }, [])

  const handleSearchSubmit = () => { setSearch(searchInput); setPage(1) }

  const handleCategory = (key) => {
    setActiveCategory((prev) => prev === key ? '' : key)
    setPage(1)
  }

  const filtered = useMemo(() => {
    let r = [...allListings]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((l) => l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q))
    }
    if (activeCategory) r = r.filter((l) => l.category === activeCategory)
    if (filters.conditions.length) r = r.filter((l) => filters.conditions.includes(l.condition))
    if (filters.state) r = r.filter((l) => l.state === filters.state)
    if (filters.priceMin) r = r.filter((l) => l.price >= Number(filters.priceMin) * 100)
    if (filters.priceMax) r = r.filter((l) => l.price <= Number(filters.priceMax) * 100)
    if (filters.shipping.length) {
      const fieldMap = { park_waybill: 'shipping_park', gig: 'shipping_gig', bolt_indrive: 'shipping_bolt_indrive', local_pickup: 'shipping_pickup' }
      r = r.filter((l) => filters.shipping.some((m) => l[fieldMap[m]]))
    }
    switch (sort) {
      case 'price_asc':   r.sort((a, b) => a.price - b.price); break
      case 'price_desc':  r.sort((a, b) => b.price - a.price); break
      case 'most_viewed': r.sort((a, b) => b.views_count - a.views_count); break
      default:            r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return r
  }, [allListings, search, activeCategory, filters, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const filterCount =
    filters.conditions.length + Number(!!filters.state) +
    Number(!!filters.priceMin) + Number(!!filters.priceMax) +
    filters.shipping.length + Number(!!activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      <BrowseNav showSearch={false} />

      {/* Search + categories bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5">
          {/* Search */}
          <div className="flex items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Search listings…"
                className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <button
              onClick={handleSearchSubmit}
              className="h-10 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              Search
            </button>
          </div>

          {/* Category pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {HERO_CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleCategory(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm border rounded-full whitespace-nowrap transition-colors shrink-0 ${
                  activeCategory === key
                    ? 'border-brand-500 text-brand-600 bg-brand-50 font-medium'
                    : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <div className="flex gap-8 items-start">

          {/* Filter sidebar — desktop */}
          <aside className="hidden lg:block sticky top-6">
            <FilterSidebar
              filters={filters}
              setFilters={(f) => { setFilters(f); setPage(1) }}
              activeCategory={activeCategory}
              setActiveCategory={(c) => { setActiveCategory(c); setPage(1) }}
            />
          </aside>

          {/* Listing grid */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{filtered.length}</span> items found
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 bg-white transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {filterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {filterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-brand-500 cursor-pointer transition-colors"
                >
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : paged.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 text-sm mb-3">No listings found</p>
                <button
                  onClick={() => { setFilters(EMPTY_FILTERS); setSearch(''); setSearchInput(''); setActiveCategory('') }}
                  className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {paged.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-brand-500 text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-brand-500 hover:text-brand-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl lg:hidden max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-base font-semibold text-gray-900">Filters</p>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar
                filters={filters}
                setFilters={(f) => { setFilters(f); setPage(1) }}
                activeCategory={activeCategory}
                setActiveCategory={(c) => { setActiveCategory(c); setPage(1); setDrawerOpen(false) }}
              />
            </div>
          </div>
        </>
      )}

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2026 PayClutr · Sustainable commerce for Nigeria
      </footer>
    </div>
  )
}
