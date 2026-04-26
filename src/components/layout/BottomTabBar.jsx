import { NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Wallet, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function BottomTabBar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const tabs = [
    { to: '/browse',                         icon: Search,      label: 'Browse'  },
    { to: user ? '/orders'  : '/login',      icon: ShoppingBag, label: 'Orders'  },
    { to: user ? '/wallet'  : '/login',      icon: Wallet,      label: 'Wallet'  },
    { to: user ? `/profile/${user.id}` : '/login', icon: User,  label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 lg:hidden safe-area-inset-bottom">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={isActive ? 2.25 : 1.75} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
