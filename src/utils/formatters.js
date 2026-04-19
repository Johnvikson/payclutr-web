export const formatNaira = (kobo) => {
  const naira = kobo / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(naira)
}

export const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatTimeAgo = (iso) => {
  const seconds = Math.floor((new Date() - new Date(iso)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const formatCondition = (condition) => {
  const map = {
    excellent: 'Excellent',
    very_good: 'Very Good',
    good: 'Good',
    fair: 'Fair',
  }
  return map[condition] || condition
}

export const formatShipping = (method) => {
  const map = {
    park_waybill: 'Park Waybill',
    gig: 'GIG Logistics',
    bolt_indrive: 'Bolt / InDrive',
    local_pickup: 'Local Pickup',
  }
  return map[method] || method
}

export const formatStatus = (status) => {
  const map = {
    pending_payment: 'Pending Payment',
    awaiting_seller_confirmation: 'Awaiting Confirmation',
    shipping_coordination: 'Shipping Coordination',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
  }
  return map[status] || status
}

export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
}

export const getAvatarColor = (name) => {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
