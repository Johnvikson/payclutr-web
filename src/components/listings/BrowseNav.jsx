import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, LogOut, User, Package, Wallet, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth.js'
import { getUnreadCount } from '../../api/endpoints.js'
import UserAvatar from '../ui/UserAvatar.jsx'

export default function BrowseNav({ searchValue = '', onSearch, showSearch = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef(null)

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
    enabled: !!user,
  })
  const unreadCount = unread?.count || 0

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-14 flex items-center gap-3">
          {/* Logo */}
          <Link to="/browse" className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 hidden sm:block">PayClutr</span>
          </Link>

          {/* Search */}
          {showSearch && (
            <div className="flex-1 max-w-lg hidden sm:block">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => onSearch?.(e.target.value)}
                  placeholder="Search listings…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {!showSearch && (
            <div className="hidden sm:flex flex-1 items-center justify-center gap-6">
              {[
                { to: '/browse',      label: 'Browse' },
                { to: '/orders',      label: 'Orders' },
                { to: '/listings/my', label: 'My Listings' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          <div className="flex-1 sm:flex-none" />

          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button
              onClick={() => navigate(user ? '/notifications' : '/login')}
              className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Sell CTA */}
            <Link
              to={user ? '/listings/create' : '/login'}
              className="hidden sm:flex items-center gap-1 btn-primary py-2 text-xs ml-1"
            >
              + Sell
            </Link>

            {/* User */}
            {user ? (
              <div className="relative ml-1" ref={userRef}>
                <button
                  onClick={() => setUserOpen((o) => !o)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <UserAvatar user={user} size="sm" />
                  <ChevronDown size={12} className="text-gray-400 hidden sm:block" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-modal border border-gray-100 z-50 py-1 overflow-hidden animate-fade-in">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    {[
                      { to: `/profile/${user.id}`, icon: User,    label: 'My Profile' },
                      { to: '/orders',             icon: Package,  label: 'My Orders' },
                      { to: '/wallet',             icon: Wallet,   label: 'Wallet' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Icon size={13} className="text-gray-400" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { logout(); navigate('/login') }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={13} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="pb-3 sm:hidden">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearch?.(e.target.value)}
                placeholder="Search listings…"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
