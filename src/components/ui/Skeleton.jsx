export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-surface-tertiary rounded ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Skeleton className="w-full aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="w-3/4 h-3.5" />
        <Skeleton className="w-1/2 h-3.5" />
        <Skeleton className="w-1/3 h-3" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-surface-border">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-48 h-3.5" />
        <Skeleton className="w-32 h-3" />
      </div>
      <Skeleton className="w-20 h-5 rounded-full shrink-0" />
      <Skeleton className="w-16 h-3 shrink-0" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
