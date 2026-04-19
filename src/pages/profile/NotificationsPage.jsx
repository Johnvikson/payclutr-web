import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell, ShoppingBag, Wallet, CheckCircle, AlertTriangle,
  ShieldCheck, BadgeCheck, XCircle,
} from 'lucide-react'
import { getNotifications, markNotificationRead, markAllRead } from '../../api/endpoints.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { formatTimeAgo } from '../../utils/formatters.js'

const TYPE_CONFIG = {
  order_placed:        { Icon: ShoppingBag, iconCls: 'text-green-600 bg-green-50' },
  payment_released:    { Icon: Wallet,      iconCls: 'text-green-600 bg-green-50' },
  delivery_confirmed:  { Icon: CheckCircle, iconCls: 'text-green-600 bg-green-50' },
  dispute_opened:      { Icon: AlertTriangle, iconCls: 'text-red-500 bg-red-50' },
  dispute_resolved:    { Icon: ShieldCheck, iconCls: 'text-blue-600 bg-blue-50' },
  kyc_approved:        { Icon: BadgeCheck,  iconCls: 'text-green-600 bg-green-50' },
  kyc_rejected:        { Icon: XCircle,     iconCls: 'text-red-500 bg-red-50' },
}
const DEFAULT_CONFIG = { Icon: Bell, iconCls: 'text-gray-400 bg-gray-100' }

function NotificationRow({ notification, onRead }) {
  const { Icon, iconCls } = TYPE_CONFIG[notification.notification_type] || DEFAULT_CONFIG

  return (
    <button
      onClick={() => onRead(notification)}
      className={`w-full text-left flex items-start gap-3 px-4 py-4 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 ${
        !notification.is_read ? 'bg-brand-50/30' : 'bg-white'
      }`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconCls}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <div className="shrink-0 mt-2 w-2 h-2 rounded-full bg-brand-500" />
      )}
    </button>
  )
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-gray-100 animate-pulse">
      <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-2.5 bg-gray-100 rounded w-16 mt-1" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => showToast('Could not mark notification as read.', 'error'),
  })

  const markAllMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); showToast('All notifications marked as read.', 'success') },
    onError: () => showToast('Something went wrong. Please try again.', 'error'),
  })

  const handleRead = (notification) => {
    if (!notification.is_read) markReadMutation.mutate(notification.id)
    if (notification.link) navigate(notification.link)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const hasUnread = unreadCount > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          {hasUnread && <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>}
        </div>
        {hasUnread && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
          >
            {markAllMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <Bell size={20} className="text-red-400" />
            </div>
            <p className="text-sm text-gray-500">Failed to load notifications. Please refresh the page.</p>
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
              <Bell size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">You'll see order updates, payment alerts, and more here.</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && notifications.length > 0 && notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} onRead={handleRead} />
        ))}
      </div>
    </div>
  )
}
