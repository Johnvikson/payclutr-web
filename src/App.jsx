import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AuthLayout from './components/layout/AuthLayout.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'

import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx'
import OtpVerifyPage from './pages/auth/OtpVerifyPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import KycPage from './pages/auth/KycPage.jsx'

import HomePage from './pages/dashboard/HomePage.jsx'

import BrowsePage from './pages/listings/BrowsePage.jsx'
import ListingDetailPage from './pages/listings/ListingDetailPage.jsx'
import CreateListingPage from './pages/listings/CreateListingPage.jsx'
import MyListingsPage from './pages/listings/MyListingsPage.jsx'

import MyOrdersPage from './pages/orders/MyOrdersPage.jsx'
import OrderDetailPage from './pages/orders/OrderDetailPage.jsx'

import DisputeDetailPage from './pages/disputes/DisputeDetailPage.jsx'

import WalletPage from './pages/wallet/WalletPage.jsx'

import ProfilePage from './pages/profile/ProfilePage.jsx'
import NotificationsPage from './pages/profile/NotificationsPage.jsx'

import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage.jsx'
import AdminListingsPage from './pages/admin/AdminListingsPage.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminDisputesPage from './pages/admin/AdminDisputesPage.jsx'
import AdminDisputeDetailPage from './pages/admin/AdminDisputeDetailPage.jsx'
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage.jsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage.jsx'
import AdminKYCPage from './pages/admin/AdminKYCPage.jsx'

import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/browse" replace />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Dashboard layout — public + protected pages share the shell */}
        <Route element={<DashboardLayout />}>
          {/* Public */}
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />

          {/* Protected */}
          <Route path="/home" element={<Navigate to="/browse" replace />} />
          <Route path="/kyc"               element={<RequireAuth><KycPage /></RequireAuth>} />
          <Route path="/listings/create"   element={<RequireAuth><CreateListingPage /></RequireAuth>} />
          <Route path="/listings/:id/edit" element={<RequireAuth><CreateListingPage /></RequireAuth>} />
          <Route path="/listings/my"       element={<RequireAuth><MyListingsPage /></RequireAuth>} />
          <Route path="/orders"            element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
          <Route path="/orders/:id"        element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
          <Route path="/disputes/:id"      element={<RequireAuth><DisputeDetailPage /></RequireAuth>} />
          <Route path="/wallet"            element={<RequireAuth><WalletPage /></RequireAuth>} />
          <Route path="/notifications"     element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/listings" element={<AdminListingsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/disputes" element={<AdminDisputesPage />} />
          <Route path="/admin/disputes/:id" element={<AdminDisputeDetailPage />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="/admin/kyc" element={<AdminKYCPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
