import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, Menu, ChevronDown, LogOut, User, Search, Plus, Package, Wallet, ShieldCheck,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUnreadCount, getNotifications, markAllRead } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../ui/Toast.jsx'
import UserAvatar from '../ui/UserAvatar.jsx'
import Logo from '../ui/Logo.jsx'
import Button from '../ui/Button.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'
import { formatTimeAgo } from '../../utils/formatters.js'

const TITLES = {
  '/browse':            'Browse',
  '/listings/my':       'My listings',
  '/listings/create':   'List an item',
  '/orders':            'My orders',
  '/wallet':            'Wallet',
  '/profile':           'Profile',
  '/kyc':               'Identity verification',
  '/notifications':     'Notifications',
}

function pageTitle(path) {
  if (TITLES[path]) return TITLES[path]
  if (path.startsWith('/listings/') && path.endsWith('/edit')) return 'Edit listing'
  if (path.startsWith('/listings/')) return 'Item details'
  if (path.startsWith('/orders/')) return 'Order details'
  if (path.startsWith('/profile/')) return 'Profile'
  if (path.startsWith('/disputes/')) return 'Dispute'
  return ''
}

export default function Navbar({ onMenuToggle, search, onSearchChange }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen]   = useState(false)
  const notifRef = useRef(null)
  const userRef  = useRef(null)
  const qc = useQueryClient()

  const isBrowse = location.pathname === '/browse'

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
    enabled: !!user,
  })
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: notifOpen && !!user,
  })
  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = unread?.count || 0

  const handleSell = (e) => {
    if (!user) return // let it navigate to /login
    const status = user.kyc_status
    if (status === 'verified') return
    e.preventDefault()
    if (status === 'pending') {
      showToast('Your identity verification is under review. You can sell once approved.', 'error')
    } else {
      const msg = status === 'rejected'
        ? 'Your KYC was rejected. Please resubmit your documents.'
        : 'Please complete identity verification before selling.'
      showToast(msg, 'error')
      navigate('/kyc')
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-14 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 z-30 flex items-center px-4 lg:px-6 gap-3">
      {/* Mobile: hamburger + logo */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <Link to="/browse" className="lg:hidden">
        <Logo size="sm" />
      </Link>

      {/* Desktop: page title */}
      <h2 className="hidden lg:block text-sm font-semibold text-gray-900 dark:text-zinc-100 shrink-0">
        {pageTitle(location.pathname)}
      </h2>

      {/* Desktop search (browse only) */}
      {isBrowse && (
        <div className="hidden lg:block ml-4 flex-1 max-w-md">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search for anything…"
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-gray-200 dark:focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* List item CTA — visible on all sizes */}
      <Link
        to={user ? '/listings/create' : '/login'}
        onClick={handleSell}
        className="hidden sm:inline-flex"
      >
        <Button size="sm" icon={Plus}>List item</Button>
      </Link>
      <Link
        to={user ? '/listings/create' : '/login'}
        onClick={handleSell}
        className="sm:hidden p-1.5 rounded-lg bg-brand text-white hover:bg-[color:var(--brand-700)] transition-colors"
        aria-label="List item"
      >
        <Plus size={18} />
      </Link>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((o) => !o); setUserOpen(false) }}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand" />
          )}
        </button>
        {notifOpen && user && (
          <div className="absolute right-0 top-11 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-modal border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllMutation.mutate()} className="text-xs text-brand hover:opacity-80 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-8">No notifications yet</p>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <Link
                    key={n.id}
                    to={n.link || '/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${!n.is_read ? 'bg-orange-50/40 dark:bg-orange-900/10' : ''}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-brand' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-gray-300 dark:text-zinc-600 mt-0.5">{formatTimeAgo(n.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setNotifOpen(false)}
              className="block text-center text-xs font-medium text-brand hover:opacity-80 py-3 border-t border-gray-100 dark:border-zinc-800"
            >
              View all
            </Link>
          </div>
        )}
      </div>

      {/* User dropdown / Login */}
      {user ? (
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen((o) => !o); setNotifOpen(false) }}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <UserAvatar user={user} size="sm" />
            <ChevronDown size={13} className="text-gray-400 dark:text-zinc-500 hidden sm:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-modal border border-gray-100 dark:border-zinc-800 z-50 py-1">
              <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">{user.first_name} {user.last_name}</p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">@{user.username || user.email?.split('@')[0]}</p>
              </div>
              {[
                { to: `/profile/${user.id}`, icon: User,        label: 'My profile' },
                { to: '/orders',             icon: Package,     label: 'My orders' },
                { to: '/wallet',             icon: Wallet,      label: 'Wallet' },
                { to: '/kyc',                icon: ShieldCheck, label: 'Identity' },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Icon size={13} className="text-gray-400 dark:text-zinc-500" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={13} />
                Log out
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
          Sign in
        </Link>
      )}
    </header>
  )
}
