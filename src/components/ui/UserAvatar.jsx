import { getInitials, getAvatarColor } from '../../utils/formatters.js'

const sizes = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-base',
  '2xl': 'w-20 h-20 text-lg',
}

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizeClass = sizes[size] || sizes.md
  const initials = getInitials(user?.first_name, user?.last_name)
  const colorClass = getAvatarColor(`${user?.first_name}${user?.last_name}`)

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={`${user.first_name} ${user.last_name}`}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center shrink-0 font-semibold text-white ${className}`}
      aria-label={`${user?.first_name} ${user?.last_name}`}
    >
      {initials}
    </div>
  )
}
