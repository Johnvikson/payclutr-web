import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, ShieldCheck, ChevronDown, LogOut, User } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUnreadCount, getNotifications, markAllRead } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import UserAvatar from '../ui/UserAvatar.jsx'
import { formatTimeAgo } from '../../utils/formatters.js'

export default function Navbar({ onMenuToggle, title = '' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen]   = useState(false)
  const notifRef = useRef(null)
  const userRef  = useRef(null)
  const qc = useQueryClient()

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: notifOpen,
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

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-14 bg-white border-b border-gray-100 z-40 flex items-center px-4 gap-3">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <Menu size={19} />
      </button>

      <Link to="/browse" className="lg:hidden flex items-center gap-1.5">
        <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
          <ShieldCheck size={13} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm">PayClutr</span>
      </Link>

      {title && (
        <h1 className="hidden lg:block text-sm font-semibold text-gray-900">{title}</h1>
      )}

      <div className="flex-1" />

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((o) => !o); setUserOpen(false) }}
          className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-modal border border-gray-100 z-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllMutation.mutate()} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No notifications yet</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    to={n.link || '/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-brand-50/40' : ''}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-brand-500' : 'bg-transparent'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">{formatTimeAgo(n.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setNotifOpen(false)}
              className="block text-center text-xs font-medium text-brand-500 hover:text-brand-600 py-3 border-t border-gray-100"
            >
              View all
            </Link>
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => { setUserOpen((o) => !o); setNotifOpen(false) }}
          className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <UserAvatar user={user} size="sm" />
          <span className="hidden sm:block text-xs font-medium text-gray-700 max-w-[100px] truncate">
            {user?.first_name}
          </span>
          <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-11 w-44 bg-white rounded-xl shadow-modal border border-gray-100 z-50 py-1 animate-fade-in">
            <Link
              to={`/profile/${user?.id}`}
              onClick={() => setUserOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={13} className="text-gray-400" />
              My Profile
            </Link>
            <Link
              to="/notifications"
              onClick={() => setUserOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Bell size={13} className="text-gray-400" />
              Notifications
            </Link>
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
    </header>
  )
}
