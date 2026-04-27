import { ShieldCheck } from 'lucide-react'

// Green-tinted shield notice — emphasizes escrow protection.
// Use on listing detail, checkout, and order pages.
export default function EscrowBadge({ children, className = '' }) {
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 ${className}`}>
      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
      <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{children}</div>
    </div>
  )
}
