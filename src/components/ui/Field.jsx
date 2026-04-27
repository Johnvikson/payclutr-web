// Form field wrapper + matching inputs

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">{label}</label>
      )}
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{hint}</p>}
    </div>
  )
}

export function TextInput({ prefix, suffix, error, className = '', ...rest }) {
  const wide = typeof prefix === 'string' && prefix.length > 2
  const prefixPad = wide ? 'pl-[5.25rem]' : prefix ? 'pl-8' : 'pl-3'
  return (
    <div className={`relative flex items-center ${className}`}>
      {prefix && (
        <span className={`absolute left-3 text-sm text-gray-500 dark:text-zinc-500 pointer-events-none ${wide ? 'pr-3 border-r border-gray-200 dark:border-zinc-700' : ''}`}>
          {prefix}
        </span>
      )}
      <input
        {...rest}
        className={`w-full h-10 ${prefixPad} ${suffix ? 'pr-8' : 'pr-3'} text-sm rounded-lg border bg-white dark:bg-zinc-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors ${
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand'
        }`}
      />
      {suffix && <span className="absolute right-3 text-sm text-gray-500 dark:text-zinc-500">{suffix}</span>}
    </div>
  )
}

export function TextArea({ rows = 4, error, className = '', ...rest }) {
  return (
    <textarea
      rows={rows}
      {...rest}
      className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors ${
        error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-zinc-700 focus:border-brand'
      } ${className}`}
    />
  )
}

const CHEVRON = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%239ca3af' stroke-width='2' viewBox='0 0 24 24'><polyline points='6 9 12 15 18 9'/></svg>\")"

export function Select({ children, className = '', ...rest }) {
  return (
    <select
      {...rest}
      className={`w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 appearance-none bg-no-repeat ${className}`}
      style={{ backgroundImage: CHEVRON, backgroundPosition: 'right 0.75rem center' }}
    >
      {children}
    </select>
  )
}

export function Checkbox({ checked, onChange, label, className = '' }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-zinc-300 ${className}`}>
      <span
        onClick={(e) => { e.preventDefault(); onChange?.(!checked) }}
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked ? 'bg-brand border-brand' : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}
