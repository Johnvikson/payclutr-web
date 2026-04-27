import { NavLink } from 'react-router-dom'
import { Search, Package, Wallet, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function BottomTabBar() {
  const { user } = useAuth()

  const tabs = [
    { to: '/browse',                                icon: Search,  label: 'Browse'  },
    { to: user ? '/orders' : '/login',              icon: Package, label: 'Orders'  },
    { to: user ? '/wallet' : '/login',              icon: Wallet,  label: 'Wallet'  },
    { to: user ? `/profile/${user.id}` : '/login',  icon: User,    label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-gray-100 flex items-stretch lg:hidden">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={label}
          to={to}
          end={to === '/browse'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-brand' : 'text-gray-500'
            }`
          }
        >
          <Icon size={20} />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
