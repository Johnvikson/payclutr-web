import client from './client.js'

// ── Auth ───────────────────────────────────────────────────────────────────────
export const login = (data) => client.post('/auth/login/', data)
export const register = (data) => client.post('/auth/register/', data)
export const googleAuth = (data) => client.post('/auth/google/', data)
export const logout = (data) => client.post('/auth/logout/', data)
export const refreshToken = (data) => client.post('/auth/token/refresh/', data)

export const getMe = () => client.get('/auth/me/')
export const updateMe = (data) => client.patch('/auth/me/', data)
export const changePassword = (data) => client.post('/auth/me/password/', data)

export const sendEmailOtp = () => client.post('/auth/me/send-otp/')
export const verifyEmailOtp = (data) => client.post('/auth/me/verify-otp/', data)

export const sendPhoneOtp   = (data = {}) => client.post('/auth/me/send-phone-otp/', data)
export const verifyPhoneOtp = (otp) => client.post('/auth/me/verify-phone-otp/', { otp })

export const submitKyc = (data) => client.post('/auth/me/kyc/', data)

export const forgotPassword = (data) => client.post('/auth/forgot-password/', data)
export const resetPassword = (data) => client.post('/auth/reset-password/', data)

export const getUserProfile = (id) => client.get(`/auth/profile/${id}/`)

// ── Listings ──────────────────────────────────────────────────────────────────
export const getListings = (filters = {}) => {
  // Defensive: ignore non-plain-object args (e.g. React Query context object
  // when this is used directly as a queryFn). Only string/number values pass through.
  const safe = {}
  if (filters && typeof filters === 'object' && !Array.isArray(filters) && !(filters instanceof AbortSignal)) {
    for (const [k, v] of Object.entries(filters)) {
      if (v == null) continue
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        safe[k] = v
      }
    }
  }
  const params = new URLSearchParams(safe).toString()
  return client.get(`/listings/${params ? '?' + params : ''}`)
}
export const getListing = (id) => client.get(`/listings/${id}/`)
export const uploadListingImage = (file) => {
  const fd = new FormData()
  fd.append('image', file)
  return client.post('/listings/upload-image/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const createListing = (data) => client.post('/listings/create/', data)
export const updateListing = (id, data) => client.patch(`/listings/${id}/edit/`, data)
export const deleteListing = (id) => client.delete(`/listings/${id}/delete/`)
export const getMyListings = (status) => {
  // Defensive: only accept string status. Guards against accidentally being
  // used directly as a React Query queryFn (which would pass a context object).
  const params = typeof status === 'string' && status ? `?status=${encodeURIComponent(status)}` : ''
  return client.get(`/listings/my/${params}`)
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = (role, status) => {
  const params = new URLSearchParams({ ...(role && { role }), ...(status && { status }) }).toString()
  return client.get(`/orders/?${params}`)
}
export const getOrder = (id) => client.get(`/orders/${id}/`)
export const createOrder = (data) => client.post('/orders/create/', data)
export const walletCheckout = (data) => client.post('/orders/wallet-checkout/', data)
export const confirmOrder = (id) => client.post(`/orders/${id}/confirm/`)
export const cancelOrder = (id, reason) => client.post(`/orders/${id}/cancel/`, { reason })
export const uploadDispatchProof = (id, data) => client.post(`/orders/${id}/dispatch/`, data)
export const generateOtp = (id) => client.post(`/orders/${id}/generate-otp/`)
export const verifyOtp = (id, otp) => client.post(`/orders/${id}/verify-otp/`, { otp })
export const confirmDelivery = (id) => client.post(`/orders/${id}/confirm-delivery/`)

// ── Order Messages ────────────────────────────────────────────────────────────
export const getOrderMessages = (id) => client.get(`/orders/${id}/messages/`)
export const sendMessage = (id, data) => client.post(`/orders/${id}/messages/send/`, data)

// ── Disputes ──────────────────────────────────────────────────────────────────
export const raiseDispute = (orderId, data) => client.post(`/disputes/orders/${orderId}/raise/`, data)
export const getDispute = (id) => client.get(`/disputes/${id}/`)
export const submitEvidence = (id, data) => client.post(`/disputes/${id}/evidence/`, data)
export const getDisputeMessages = (id) => client.get(`/disputes/${id}/messages/`)
export const sendDisputeMessage = (id, data) => client.post(`/disputes/${id}/messages/send/`, data)

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWallet = () => client.get('/wallet/')
export const requestWithdrawal = (data) => client.post('/wallet/withdraw/', data)
export const getDepositAccount = () => client.get('/wallet/deposit-account/')
export const setupDepositAccount = (data) => client.post('/wallet/deposit-account/setup/', data)

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () => client.get('/notifications/')
export const getUnreadCount = () => client.get('/notifications/unread/')
export const markAllRead = () => client.post('/notifications/read-all/')
export const markNotificationRead = (id) => client.post(`/notifications/${id}/read/`)

// ── Ratings ───────────────────────────────────────────────────────────────────
export const submitRating = (orderId, data) => client.post(`/orders/${orderId}/rate/`, data)

// ── Admin — Stats & Settings ──────────────────────────────────────────────────
export const getAdminStats = () => client.get('/admin/stats/')
export const getSettings = () => client.get('/admin/settings/')
export const updateSettings = (data) => client.post('/admin/settings/update/', data)

// ── Admin — Users ─────────────────────────────────────────────────────────────
export const getAdminUsers = (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  return client.get(`/auth/admin/users/?${params}`)
}
export const approveKyc = (id) => client.post(`/auth/admin/users/${id}/approve-kyc/`)
export const rejectKyc = (id, reason) => client.post(`/auth/admin/users/${id}/reject-kyc/`, { reason })
export const banUser = (id, reason) => client.post(`/auth/admin/users/${id}/ban/`, { reason })
export const unbanUser = (id) => client.post(`/auth/admin/users/${id}/unban/`)
export const awardBadge = (id) => client.post(`/auth/admin/users/${id}/award-badge/`)
export const revokeBadge = (id) => client.post(`/auth/admin/users/${id}/revoke-badge/`)

// ── Admin — Listings ──────────────────────────────────────────────────────────
export const getAdminListings = (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  return client.get(`/listings/admin/?${params}`)
}
export const adminDelistListing  = (id)         => client.post(`/listings/admin/${id}/delist/`)
export const adminApproveListing = (id)         => client.post(`/listings/admin/${id}/approve/`)
export const adminRejectListing  = (id, reason) => client.post(`/listings/admin/${id}/reject/`, { reason })

// ── Admin — Orders ────────────────────────────────────────────────────────────
export const getAdminOrders = (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  return client.get(`/orders/admin/?${params}`)
}

// ── Admin — Disputes ──────────────────────────────────────────────────────────
export const getAdminDisputes = (status) => {
  const params = status ? `?status=${status}` : ''
  return client.get(`/disputes/admin/${params}`)
}
export const resolveDispute = (id, data) => client.post(`/disputes/admin/${id}/resolve/`, data)

// ── Admin — Withdrawals ───────────────────────────────────────────────────────
export const getAdminWithdrawals = (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  return client.get(`/wallet/admin/?${params}`)
}
export const processWithdrawal = (id, ref) => client.post(`/wallet/admin/${id}/process/`, { payment_reference: ref })
export const rejectWithdrawal = (id, reason) => client.post(`/wallet/admin/${id}/reject/`, { rejection_reason: reason })
