import { Loader2 } from 'lucide-react'

export default function LoadingButton({
  isLoading = false,
  children,
  onClick,
  className = 'btn-primary',
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Loading…</span>
        </>
      ) : children}
    </button>
  )
}
