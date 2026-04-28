import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, Tag, Package, Wallet, ShieldCheck, User, Bell, LogOut, LogIn,
  LayoutDashboard, ArrowDownToLine, Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import Logo from '../ui/Logo.jsx'
import UserAvatar from '../ui/UserAvatar.jsx'

function NavItem({ to, icon: Icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
          isActive
            ? 'text-brand'
            : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand rounded-r" />}
          <Icon size={16} />
          <span>{label}</span>
          {badge ? (
            <span className="ml-auto text-[10px] bg-brand text-white px-1.5 py-0.5 rounded-full">{badge}</span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }
  const handleClick = () => onClose?.()

  const isAdminArea = location.pathname.startsWith('/admin')
  const isAdmin = user?.is_staff || user?.role === 'admin'

  return (
    <aside className="flex flex-col h-full w-60 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
      {/* Brand */}
      <div className="px-5 h-14 flex items-center border-b border-gray-100 dark:border-zinc-800 shrink-0">
        <NavLink to="/browse" onClick={handleClick}>
          <Logo size="md" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <NavItem to="/browse"      icon={Search}      label="Browse"        onClick={handleClick} />
        {user && (
          <>
            <NavItem to="/listings/my" icon={Tag}         label="My listings"   onClick={handleClick} />
            <NavItem to="/orders"      icon={Package}     label="Orders"        onClick={handleClick} />
            <NavItem to="/wallet"      icon={Wallet}      label="Wallet"        onClick={handleClick} />
            <NavItem to={`/profile/${user.id}`} icon={User} label="Profile"     onClick={handleClick} />
            <NavItem to="/kyc"         icon={ShieldCheck} label="KYC"           onClick={handleClick} />
            <NavItem to="/notifications" icon={Bell}      label="Notifications" onClick={handleClick} />
          </>
        )}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-gray-100 dark:border-zinc-800" />
            <div className="px-3 text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-600 font-semibold mb-1">Admin</div>
            <NavItem to="/admin"             icon={LayoutDashboard} label="Dashboard"   onClick={handleClick} />
            <NavItem to="/admin/kyc"         icon={ShieldCheck}     label="KYC review"  onClick={handleClick} />
            <NavItem to="/admin/withdrawals" icon={ArrowDownToLine} label="Withdrawals" onClick={handleClick} />
            <NavItem to="/admin/users"       icon={Users}           label="Users"       onClick={handleClick} />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-zinc-800 shrink-0">
        {user ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{user.first_name} {user.last_name}</div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-500 truncate">@{user.username || user.email?.split('@')[0]}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            onClick={handleClick}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-zinc-300"
          >
            <LogIn size={16} className="text-gray-500 dark:text-zinc-500" />
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  )
}
