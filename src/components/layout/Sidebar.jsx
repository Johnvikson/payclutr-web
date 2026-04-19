import { NavLink, useNavigate } from 'react-router-dom'
import { Search, Tag, ShoppingBag, Wallet, PlusCircle, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../ui/Toast.jsx'
import UserAvatar from '../ui/UserAvatar.jsx'

const navItems = [
  { to: '/browse',      icon: Search,      label: 'Browse' },
  { to: '/listings/my', icon: Tag,         label: 'My Listings' },
  { to: '/orders',      icon: ShoppingBag, label: 'My Orders' },
  { to: '/wallet',      icon: Wallet,      label: 'Wallet' },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSell = (e) => {
    const status = user?.kyc_status
    if (status === 'verified') return
    e.preventDefault()
    onClose?.()
    if (status === 'pending') {
      showToast('Your identity verification is under review. You can sell once approved.', 'error')
    } else {
      const msg = status === 'rejected'
        ? 'Your KYC was rejected. Please resubmit your documents.'
        : 'Please complete identity verification before selling.'
      showToast(msg, 'error')
      setTimeout(() => navigate('/kyc'), 1500)
    }
  }

  return (
    <aside className="flex flex-col h-full w-60 bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center shrink-0">
        <NavLink to="/browse" onClick={onClose} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <ShieldCheck size={15} className="text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">PayClutr</span>
        </NavLink>
      </div>

      {/* Sell CTA */}
      <div className="px-4 pb-4 shrink-0">
        <NavLink to="/listings/create" onClick={handleSell} className="btn-primary w-full justify-center text-xs py-2">
          <PlusCircle size={14} />
          Sell an Item
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 ${
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0 space-y-1">
        <NavLink
          to={`/profile/${user?.id}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserAvatar user={user} size="sm" />
          <p className="text-sm font-medium text-gray-700 truncate">
            {user?.first_name} {user?.last_name}
          </p>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  )
}
