import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import BottomTabBar from './BottomTabBar.jsx'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-60 z-40">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden shadow-modal">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <Navbar
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        search={search}
        onSearchChange={setSearch}
      />

      <main className="lg:pl-60 pt-14 pb-16 lg:pb-6">
        <Outlet context={{ search, setSearch }} />
      </main>

      <BottomTabBar />
    </div>
  )
}
