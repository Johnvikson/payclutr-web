import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, MapPin, Eye, Heart, Edit2, Trash2, Lock,
  ArrowRight, Wallet, BadgeCheck, Truck, Package, Zap,
} from 'lucide-react'
import ListingCard from '../../components/listings/ListingCard.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Stars from '../../components/ui/Stars.jsx'
import EscrowBadge from '../../components/ui/EscrowBadge.jsx'
import CheckoutModal from '../../components/orders/CheckoutModal.jsx'
import { getListing, getListings } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatCondition, formatDate, formatTimeAgo } from '../../utils/formatters.js'

const SHIPPING_OPTIONS = [
  {
    key: 'park_waybill',
    field: 'shipping_park',
    icon: Truck,
    label: 'Park Waybill',
    eta: 'Same day to 2 days',
    note: 'Buyer and seller agree waybill details in chat. Buyer pays the delivery provider on receipt.',
  },
  {
    key: 'gig',
    field: 'shipping_gig',
    icon: Package,
    label: 'GIG Logistics',
    eta: '2-4 days delivery',
    note: 'Seller drops off at GIG and shares the waybill amount. Buyer pays GIG directly, never the seller.',
  },
  {
    key: 'bolt_indrive',
    field: 'shipping_bolt_indrive',
    icon: Zap,
    label: 'Bolt / InDrive',
    eta: 'Same day delivery',
    note: 'Buyer pays the Bolt or InDrive rider directly when the product is received.',
  },
  {
    key: 'local_pickup',
    field: 'shipping_pickup',
    icon: MapPin,
    label: 'Local Pickup',
    eta: 'Free',
    note: 'Buyer and seller agree a pickup point. OTP confirms handover.',
  },
]

function videoPreviewUrl(url) {
  if (!url) return ''
  return url.includes('#') ? url : `${url}#t=0.1`
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [imgIdx, setImgIdx] = useState(0)
  const [shipping, setShipping] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
  })

  const { data: relatedData } = useQuery({
    queryKey: ['listings', 'related'],
    queryFn: getListings,
    enabled: !!listing,
  })

  if (isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-6">
        <div className="grid lg:grid-cols-12 gap-6 animate-pulse">
          <div className="lg:col-span-8 space-y-4">
            <div className="aspect-[4/3] bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-72 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) return null

  const seller = listing.seller || {}
  const sellerName = `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'Seller'
  const sellerFirst = sellerName.split(' ')[0]

  const images = listing.images?.length ? listing.images : [{ id: 0, image_url: null }]
  const isOwner = user?.id === seller.id
  const desc = listing.description || ''
  const isLong = desc.length > 280
  const location = [listing.city, listing.state].filter(Boolean).join(', ')

  const enabledShipping = SHIPPING_OPTIONS.filter((s) => listing[s.field])
  const selectedShipping = enabledShipping.find((s) => s.key === shipping) || enabledShipping[0]

  const itemPrice = listing.price ?? 0
  const total = itemPrice

  const balance = user?.wallet_balance ?? 0
  const sufficient = balance >= total

  const related = (relatedData?.data || [])
    .filter((l) => l.seller?.id === seller.id && l.id !== listing.id)
    .slice(0, 4)

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)] pb-24 lg:pb-0">
      <div className="px-4 lg:px-8 py-6 max-w-[1100px] mx-auto">

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ChevronLeft size={14} /> Back to browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left column: gallery + content ─────────────────── */}
          <div className="lg:col-span-8">
            {/* Gallery card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-800">
                {images[imgIdx]?.image_url ? (
                  <img
                    src={images[imgIdx].image_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-600 text-sm">
                    No image
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={img.id ?? i}
                      onClick={() => setImgIdx(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === imgIdx ? 'border-brand' : 'border-transparent hover:border-gray-200 dark:hover:border-zinc-700'
                      }`}
                    >
                      {img.image_url ? (
                        <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-zinc-800" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {listing.video_url && (
                <div className="border-t border-gray-100 dark:border-zinc-800 p-3">
                  <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">Product video</div>
                  <video
                    key={listing.video_url}
                    src={videoPreviewUrl(listing.video_url)}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full rounded-lg bg-black aspect-video object-contain"
                  />
                </div>
              )}
            </div>

            {/* Title + price */}
            <div className="mt-5">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-zinc-100 leading-tight">
                  {listing.title}
                </h1>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
                  aria-label="Save listing"
                >
                  <Heart size={18} />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <div className="text-2xl lg:text-3xl font-bold text-brand">{formatNaira(itemPrice)}</div>
                <Badge tone="gray" size="xs" dot={false}>{formatCondition(listing.condition)}</Badge>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-500 flex-wrap">
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {location}
                  </span>
                )}
                {listing.created_at && (
                  <>
                    <span>·</span>
                    <span>Listed {formatTimeAgo(listing.created_at)}</span>
                  </>
                )}
                {listing.views_count != null && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={12} /> {listing.views_count} views
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* About this item */}
            <div className="mt-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">About this item</h3>
              <p className="mt-3 text-sm text-gray-700 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                {isLong && !expanded ? desc.slice(0, 280) + '…' : desc || 'No description provided.'}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 text-xs font-medium text-brand hover:underline"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            <div className="mt-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Condition notes</h3>
              <div className="mt-3 grid gap-3">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                    Defects
                  </span>
                  <span className="inline-flex max-w-full items-center rounded-full bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-zinc-300 whitespace-pre-line">
                    {listing.defects || 'None'}
                  </span>
                </div>
                {listing.extra_features && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide">Extra features</div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-zinc-400 whitespace-pre-line">
                      {listing.extra_features}
                    </p>
                  </div>
                )}
                {listing.receipt_url && (
                  <a
                    href={listing.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    View uploaded receipt
                  </a>
                )}
              </div>
            </div>

            {/* About the seller */}
            <div className="mt-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-4">About the seller</h3>
              <div className="flex items-center gap-4">
                <UserAvatar user={seller} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{sellerName}</div>
                    {seller.is_trusted_seller && <BadgeCheck size={16} className="text-blue-500 shrink-0" />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500 flex-wrap">
                    <Stars value={seller.trust_score} size={12} />
                    <span className="font-medium text-gray-700 dark:text-zinc-300">
                      {seller.trust_score != null ? Number(seller.trust_score).toFixed(1) : '—'}
                    </span>
                    <span>·</span>
                    <span>{seller.total_sales || 0} sales</span>
                    {seller.created_at && (
                      <>
                        <span>·</span>
                        <span>Joined {formatDate(seller.created_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Escrow lock notice */}
              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <Lock size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Seller contact and messaging unlock <span className="font-semibold">after payment is held in escrow</span>. PayClutr only protects trades completed on-platform.
                </div>
              </div>

              <Link
                to={`/profile/${seller.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand font-medium hover:underline"
              >
                View {sellerFirst}'s other listings <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* ── Right column: purchase / owner card ────────────── */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
                {isOwner ? (
                  /* Owner controls */
                  <>
                    <div className="text-xs text-gray-500 dark:text-zinc-500">Item price</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-zinc-100 mt-0.5">{formatNaira(itemPrice)}</div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500">
                      <Eye size={13} />
                      <span>{listing.views_count || 0} people viewed this listing</span>
                    </div>
                    <Link to={`/listings/${listing.id}/edit`} className="mt-4 block">
                      <Button variant="outline" full icon={Edit2}>Edit listing</Button>
                    </Link>
                    <Button variant="danger" full className="mt-2" icon={Trash2}>Delist item</Button>
                  </>
                ) : (
                  /* Buyer purchase flow */
                  <>
                    <div className="text-xs text-gray-500 dark:text-zinc-500">Item price</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-zinc-100 mt-0.5">{formatNaira(itemPrice)}</div>

                    {enabledShipping.length > 0 && (
                      <div className="mt-5">
                        <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">Shipping option</div>
                        <div className="space-y-2">
                          {enabledShipping.map((opt) => {
                            const active = (shipping || enabledShipping[0].key) === opt.key
                            return (
                              <label
                                key={opt.key}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  active
                                    ? 'border-brand bg-orange-50/50 dark:bg-orange-950/10'
                                    : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-brand' : 'border-gray-300 dark:border-zinc-600'}`}>
                                  {active && <span className="w-2 h-2 rounded-full bg-brand" />}
                                </span>
                                <input
                                  type="radio"
                                  className="hidden"
                                  checked={active}
                                  onChange={() => setShipping(opt.key)}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">{opt.label}</div>
                                  <div className="text-[11px] text-gray-500 dark:text-zinc-500">{opt.eta}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                        {selectedShipping && (
                          <div
                            className={[
                              'mt-3 rounded-lg border px-3 py-2.5 text-xs leading-relaxed',
                              selectedShipping.key === 'gig'
                                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
                                : 'border-amber-100 bg-amber-50/70 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-300',
                            ].join(' ')}
                          >
                            {selectedShipping.note}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price breakdown */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-1.5 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                        <span>Item</span>
                        <span>{formatNaira(itemPrice)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                        <span>Delivery fee</span>
                        <span>Paid directly to courier</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 dark:text-zinc-100 pt-1.5 border-t border-gray-100 dark:border-zinc-800 mt-2">
                        <span>Escrow total</span>
                        <span>{formatNaira(total)}</span>
                      </div>
                    </div>

                    {/* Buy CTA */}
                    {user ? (
                      <Button
                        full
                        className="mt-4"
                        icon={Wallet}
                        disabled={!sufficient || enabledShipping.length === 0}
                        onClick={() => setCheckoutOpen(true)}
                      >
                        Buy with Wallet
                      </Button>
                    ) : (
                      <Link to="/login" className="block mt-4">
                        <Button full>Sign in to buy</Button>
                      </Link>
                    )}

                    {user && (
                      <div className="mt-2 text-center text-[11px] text-gray-500 dark:text-zinc-500">
                        Wallet balance: <span className="font-semibold text-gray-700 dark:text-zinc-300">{formatNaira(balance)}</span>
                        {!sufficient && (
                          <>
                            {' · '}
                            <Link to="/wallet" className="text-brand font-medium hover:underline">Fund wallet</Link>
                          </>
                        )}
                      </div>
                    )}

                    <EscrowBadge className="mt-4">
                      Your payment is held in escrow and only released to the seller after you confirm delivery.
                    </EscrowBadge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* More from this seller */}
        {related.length > 0 && (
          <div className="mt-10">
            <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-4">
              More from {sellerFirst}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky buy bar */}
      {!isOwner && user && (
        <div className="fixed bottom-16 left-0 right-0 z-30 lg:hidden bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-brand">{formatNaira(itemPrice)}</p>
            <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate">{formatCondition(listing.condition)}</p>
          </div>
          <Button
            full
            disabled={!sufficient || enabledShipping.length === 0}
            onClick={() => setCheckoutOpen(true)}
            className="flex-1"
          >
            Buy with Wallet
          </Button>
        </div>
      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        listing={listing}
      />
    </div>
  )
}
