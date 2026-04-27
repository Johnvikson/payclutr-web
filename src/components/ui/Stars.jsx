import { Star } from 'lucide-react'

export default function Stars({ value = 0, size = 14 }) {
  const filled = Math.round(Number(value) || 0)
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= filled ? 'text-amber-400' : 'text-gray-200 dark:text-zinc-700'}
          fill={i <= filled ? 'currentColor' : 'transparent'}
        />
      ))}
    </span>
  )
}
