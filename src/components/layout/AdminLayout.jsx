import { useState } from 'react'
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Tag, ShoppingBag,
  AlertTriangle, Wallet, Settings, BarChart2,
  Shield, LogOut, Menu, FilePenLine, Mail,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

const adminNav = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard',  exact: true },
  { to: '/admin/users',       icon: Users,           label: 'Users' },
  { to: '/admin/listings',    icon: Tag,             label: 'Listings' },
  { to: '/admin/orders',      icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/disputes',    icon: AlertTriangle,   label: 'Disputes' },
  { to: '/admin/withdrawals', icon: Wallet,          label: 'Withdrawals' },
  { to: '/admin/kyc',         icon: Shield,          label: 'KYC Review' },
  { to: '/admin/cms',         icon: FilePenLine,     label: 'CMS' },
  { to: '/admin/emails',      icon: Mail,            label: 'Emails' },
  { to: '/admin/analytics',   icon: BarChart2,       label: 'Analytics' },
  { to: '/admin/settings',    icon: Settings,        label: 'Settings' },
]

function AdminSidebar({ onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex flex-col h-full w-56 bg-gray-950 border-r border-gray-800">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <img
            src="/payclutr-mark-rounded.png"
            alt="PayClutr"
            className="w-7 h-7 rounded-lg object-contain shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-white leading-none">PayClutr</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {adminNav.map((item) => {
          const NavIcon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                }`
              }
            >
              <NavIcon size={15} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800 shrink-0">
        <button
          onClick={() => { logout(); navigate('/admin/login') }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-800/60 hover:text-gray-300 transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const { isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-800 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 fixed inset-y-0 left-0 z-50">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-56 z-50 lg:hidden">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 lg:pl-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
          <div className="flex-1" />
          <span className="text-xs text-gray-400 font-mono">v1.0</span>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
