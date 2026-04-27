// Brand logo — uses the rounded mark from /public/payclutr-mark-rounded.png

const FONT_SIZES = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl', xl: 'text-3xl' }
const MARK_SIZES = { sm: 22, md: 28, lg: 36, xl: 44 }

export default function Logo({ size = 'md', mono = false, markOnly = false }) {
  const dim = MARK_SIZES[size]
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <img
        src="/payclutr-mark-rounded.png"
        alt="PayClutr"
        width={dim}
        height={dim}
        className="rounded-[22%] object-contain shrink-0"
      />
      {!markOnly && (
        <span className={`font-bold tracking-tight ${FONT_SIZES[size]} ${mono ? 'text-white' : 'text-gray-900 dark:text-zinc-100'}`}>
          PayClutr
        </span>
      )}
    </span>
  )
}
