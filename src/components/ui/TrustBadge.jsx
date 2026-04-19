import { Star, BadgeCheck } from 'lucide-react'

const sizes = {
  sm: { star: 11, text: 'text-xs',  gap: 'gap-1',   badge: 10 },
  md: { star: 13, text: 'text-sm',  gap: 'gap-1',   badge: 12 },
  lg: { star: 15, text: 'text-base',gap: 'gap-1.5', badge: 14 },
}

export default function TrustBadge({ score, isTrusted, size = 'md' }) {
  const s = sizes[size] ?? sizes.md
  return (
    <div className={`inline-flex items-center ${s.gap}`}>
      <Star size={s.star} className="text-amber-400 fill-amber-400" />
      <span className={`${s.text} font-medium text-gray-700`}>
        {score != null ? Number(score).toFixed(1) : '—'}
      </span>
      {isTrusted && (
        <BadgeCheck size={s.badge} className="text-brand-500" />
      )}
    </div>
  )
}
