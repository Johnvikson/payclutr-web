import { useState, useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import BottomTabBar from './BottomTabBar.jsx'

const PAGE_TITLES = {
  '/browse':         'Browse',
  '/listings/my':    'My Listings',
  '/listings/create':'Create Listing',
  '/orders':         'My Orders',
  '/wallet':         'Wallet',
  '/notifications':  'Notifications',
  '/kyc':            'KYC Verification',
}

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const title = PAGE_TITLES[location.pathname] || ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-60 z-50">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden shadow-modal">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} title={title} />

      <main className="lg:pl-60 pt-14 pb-20 lg:pb-6">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
