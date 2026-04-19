import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Heart } from 'lucide-react'
import { formatNaira } from '../../utils/formatters.js'
import ConditionBadge from '../ui/ConditionBadge.jsx'

export default function ListingCard({ listing }) {
  const navigate = useNavigate()
  const [wished, setWished] = useState(false)

  return (
    <div
      onClick={() => navigate(`/listings/${listing.id}`)}
      className="cursor-pointer group bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-card transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {listing.images?.[0]?.image_url ? (
          <img
            src={listing.images[0].image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-xs">No image</span>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <ConditionBadge condition={listing.condition} />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setWished((w) => !w) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-xs flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart size={13} className={wished ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug">
          {listing.title}
        </p>
        <p className="text-sm font-bold text-brand-500 mb-1.5">
          {formatNaira(listing.price)}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{listing.city}, {listing.state}</span>
        </div>
      </div>
    </div>
  )
}
