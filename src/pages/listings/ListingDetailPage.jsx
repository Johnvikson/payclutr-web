import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, MapPin, Eye, Truck,
  Package, Zap, Shield, Edit2, Trash2, Calendar,
} from 'lucide-react'
import BrowseNav from '../../components/listings/BrowseNav.jsx'
import ListingCard from '../../components/listings/ListingCard.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import TrustBadge from '../../components/ui/TrustBadge.jsx'
import CheckoutModal from '../../components/orders/CheckoutModal.jsx'
import { getListing, getListings } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatCondition, formatDate } from '../../utils/formatters.js'

const SHIPPING_INFO = {
  park_waybill:   { icon: Truck,   label: 'Park Waybill',   note: 'Buyer pays driver directly on delivery' },
  gig:            { icon: Package, label: 'GIG Logistics',  note: 'Buyer pays GIG after cost confirmed in chat' },
  bolt_indrive:   { icon: Zap,     label: 'Bolt / InDrive', note: 'Buyer books ride, pays driver on delivery' },
  local_pickup:   { icon: MapPin,  label: 'Local Pickup',   note: 'Free — OTP confirmed handover' },
}

const CONDITION_COLORS = {
  excellent: 'bg-green-50 text-green-700',
  very_good: 'bg-blue-50 text-blue-700',
  good:      'bg-amber-50 text-amber-700',
  fair:      'bg-gray-100 text-gray-600',
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [imgIndex, setImgIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
  })

  const { data: relatedData } = useQuery({
    queryKey: ['listings', 'related'],
    queryFn: getListings,
    enabled: !!listing,
  })
  const related = (relatedData?.data || [])
    .filter((l) => l.category === listing?.category && l.id !== listing?.id)
    .slice(0, 4)

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <BrowseNav />
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        <div className="flex-1 space-y-4">
          <div className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="w-72 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  )

  if (!listing) return null

  const images = listing.images?.length ? listing.images : [{ id: 0, image_url: null }]
  const isSeller = user?.id === listing.seller?.id
  const desc = listing.description || ''
  const isLong = desc.length > 200
  const shippingMethods = [
    listing.shipping_park         && 'park_waybill',
    listing.shipping_gig          && 'gig',
    listing.shipping_bolt_indrive && 'bolt_indrive',
    listing.shipping_pickup        && 'local_pickup',
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <BrowseNav />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link to="/browse" className="hover:text-gray-600 transition-colors">Browse</Link>
          <ChevronRight size={14} />
          <span className="text-gray-500">{listing.category}</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 line-clamp-1">{listing.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Image gallery */}
            <div className="relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden mb-3">
              {images[imgIndex]?.image_url ? (
                <img src={images[imgIndex].image_url} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow-sm flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow-sm flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {imgIndex + 1} / {images.length}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mb-6">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setImgIndex(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                      i === imgIndex ? 'border-brand-500' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {img.image_url ? (
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Title & price */}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug mb-2">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-2xl font-bold text-brand-600">{formatNaira(listing.price)}</p>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CONDITION_COLORS[listing.condition] || 'bg-gray-100 text-gray-600'}`}>
                {formatCondition(listing.condition)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
              <MapPin size={14} className="shrink-0 text-gray-400" />
              <span>{listing.city}, {listing.state}</span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {isLong && !expanded ? desc.slice(0, 200) + '…' : desc}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 mt-1.5 transition-colors"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Shipping */}
            {shippingMethods.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Shipping Options</h2>
                <div className="space-y-2">
                  {shippingMethods.map((method) => {
                    const { icon: Icon, label, note } = SHIPPING_INFO[method]
                    return (
                      <div key={method} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-white">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          <Icon size={15} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{note}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-6 space-y-3">
              {/* Seller card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex items-start gap-3 mb-4">
                  <UserAvatar user={listing.seller} size="xl" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {listing.seller?.first_name} {listing.seller?.last_name}
                    </p>
                    <TrustBadge score={listing.seller?.trust_score} isTrusted={listing.seller?.is_trusted_seller} size="sm" />
                    <p className="text-xs text-gray-400 mt-1">
                      {listing.seller?.total_sales} sales · Member since {formatDate(listing.seller?.created_at)}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/profile/${listing.seller?.id}`}
                  className="block w-full py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 text-center hover:border-gray-300 hover:text-gray-900 transition-colors"
                >
                  View Profile
                </Link>
              </div>

              {/* Action card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
                {isSeller ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <Eye size={13} />
                      <span>{listing.views_count} people viewed this listing</span>
                    </div>
                    <Link
                      to={`/listings/${listing.id}/edit`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-brand-500 text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-colors"
                    >
                      <Edit2 size={15} />
                      Edit Listing
                    </Link>
                    <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                      Delist Item
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCheckoutOpen(true)}
                      className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
                    >
                      Buy Now
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                      <Shield size={12} />
                      <span>Escrow protected — pay only when satisfied</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                <Calendar size={12} />
                <span>Listed {formatDate(listing.created_at)}</span>
                {!isSeller && (
                  <>
                    <span>·</span>
                    <Eye size={12} />
                    <span>{listing.views_count} views</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-base font-semibold text-gray-900 mb-5">More in {listing.category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky buy bar */}
      {!isSeller && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-4">
          <div>
            <p className="text-lg font-bold text-brand-600">{formatNaira(listing.price)}</p>
            <p className="text-xs text-gray-400">{formatCondition(listing.condition)}</p>
          </div>
          <button
            onClick={() => setCheckoutOpen(true)}
            className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
          >
            Buy Now
          </button>
        </div>
      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        listing={listing}
      />

      <footer className="border-t border-gray-100 mt-12 py-6 text-center text-sm text-gray-400">
        © 2026 PayClutr · Sustainable commerce for Nigeria
      </footer>
    </div>
  )
}
