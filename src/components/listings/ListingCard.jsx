import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { formatNaira, formatTimeAgo } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'

const CONDITION_LABEL = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good:      'Good',
  fair:      'Fair',
  new:       'New',
  like_new:  'Like New',
}

export default function ListingCard({ listing }) {
  const navigate = useNavigate()
  const img = listing.images?.[0]?.image_url || listing.image_url
  const conditionLabel = CONDITION_LABEL[listing.condition] || listing.condition
  const location = [listing.city, listing.state].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={() => navigate(`/listings/${listing.id}`)}
      className="group text-left bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No image
          </div>
        )}
        {conditionLabel && (
          <div className="absolute top-2 left-2">
            <Badge tone="gray" size="xs" dot={false}>{conditionLabel}</Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 line-clamp-1">{listing.title}</div>
        <div className="mt-1 text-base font-bold text-brand">{formatNaira(listing.price)}</div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{location || '—'}</span>
          {listing.created_at && (
            <>
              <span>·</span>
              <span className="whitespace-nowrap">{formatTimeAgo(listing.created_at)}</span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}
