// Design-system button. Use across the app instead of ad-hoc classes.

import { forwardRef } from 'react'

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-sm gap-2',
}

const VARIANTS = {
  primary:   'bg-brand text-white hover:bg-[color:var(--brand-700)] focus:ring-brand',
  secondary: 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:ring-gray-300',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:     'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:ring-gray-300',
  outline:   'border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 bg-transparent focus:ring-gray-300',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, full, className = '', children, ...rest },
  ref,
) {
  const iconSize = size === 'sm' ? 14 : 16
  return (
    <button
      ref={ref}
      {...rest}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${SIZES[size]} ${VARIANTS[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
      {IconRight && <IconRight size={iconSize} />}
    </button>
  )
})

export default Button
