export const mockUser = {
  id: 1,
  uuid: 'usr_001',
  first_name: 'Victor',
  last_name: 'Johnson',
  email: 'victor@payclutr.com',
  phone: '08012345678',
  kyc_status: 'verified',
  role: 'seller',
  avatar_url: null,
  wallet_balance: 1700000,
  trust_score: 4.5,
  total_sales: 12,
  total_purchases: 5,
  dispute_count: 0,
  is_trusted_seller: true,
  state: 'Lagos',
  city: 'Ikeja',
  created_at: '2025-01-15T10:00:00Z',
}

export const mockSeller = {
  id: 2,
  uuid: 'usr_002',
  first_name: 'Amaka',
  last_name: 'Obi',
  email: 'amaka@example.com',
  phone: '08098765432',
  kyc_status: 'verified',
  role: 'seller',
  avatar_url: null,
  wallet_balance: 4500000,
  trust_score: 4.8,
  total_sales: 34,
  total_purchases: 8,
  dispute_count: 0,
  is_trusted_seller: true,
  state: 'Lagos',
  city: 'Lekki',
  created_at: '2024-11-10T08:00:00Z',
}

export const mockListings = [
  {
    id: 1, uuid: 'lst_001', seller_id: 2, seller: mockSeller,
    title: 'Samsung 55 inch Smart TV',
    description: 'Barely used Samsung smart TV. Works perfectly. Selling because I upgraded.',
    category: 'Electronics', condition: 'very_good', price: 18000000,
    status: 'active', state: 'Lagos', city: 'Lekki',
    shipping_park: true, shipping_gig: true, shipping_bolt_indrive: true, shipping_pickup: true,
    views_count: 45,
    images: [{ id: 1, image_url: null, is_primary: true }],
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 2, uuid: 'lst_002', seller_id: 2, seller: mockSeller,
    title: 'iPhone 13 Pro Max 256GB',
    description: 'Nigerian used iPhone 13 Pro Max. No fault, battery health 89%.',
    category: 'Electronics', condition: 'good', price: 35000000,
    status: 'active', state: 'Abuja', city: 'Wuse',
    shipping_park: true, shipping_gig: true, shipping_bolt_indrive: false, shipping_pickup: true,
    views_count: 120,
    images: [{ id: 2, image_url: null, is_primary: true }],
    created_at: '2026-02-03T09:00:00Z',
  },
  {
    id: 3, uuid: 'lst_003', seller_id: 2, seller: mockSeller,
    title: 'Office Chair — Ergonomic',
    description: 'High quality ergonomic office chair. Used for 8 months.',
    category: 'Furniture', condition: 'good', price: 4500000,
    status: 'active', state: 'Lagos', city: 'Victoria Island',
    shipping_park: false, shipping_gig: true, shipping_bolt_indrive: true, shipping_pickup: true,
    views_count: 23,
    images: [{ id: 3, image_url: null, is_primary: true }],
    created_at: '2026-02-05T11:00:00Z',
  },
  {
    id: 4, uuid: 'lst_004', seller_id: 2, seller: mockSeller,
    title: 'Adidas Sneakers Size 43',
    description: 'Authentic Adidas sneakers. Worn twice. Still very clean.',
    category: 'Fashion & Accessories', condition: 'excellent', price: 2500000,
    status: 'active', state: 'Lagos', city: 'Surulere',
    shipping_park: true, shipping_gig: true, shipping_bolt_indrive: true, shipping_pickup: true,
    views_count: 67,
    images: [{ id: 4, image_url: null, is_primary: true }],
    created_at: '2026-02-06T14:00:00Z',
  },
  {
    id: 5, uuid: 'lst_005', seller_id: 2, seller: mockSeller,
    title: 'Baby Cot with Mattress',
    description: 'Wooden baby cot with mattress. Used for 6 months. Very sturdy.',
    category: 'Baby & Kids Items', condition: 'very_good', price: 3500000,
    status: 'active', state: 'Rivers', city: 'Port Harcourt',
    shipping_park: true, shipping_gig: true, shipping_bolt_indrive: false, shipping_pickup: true,
    views_count: 18,
    images: [{ id: 5, image_url: null, is_primary: true }],
    created_at: '2026-02-07T08:00:00Z',
  },
  {
    id: 6, uuid: 'lst_006', seller_id: 2, seller: mockSeller,
    title: 'Midea Standing AC 1.5HP',
    description: 'Midea standing air conditioner. Cooling perfectly. 2 years old.',
    category: 'Home Appliances', condition: 'good', price: 12000000,
    status: 'active', state: 'Abuja', city: 'Garki',
    shipping_park: false, shipping_gig: false, shipping_bolt_indrive: false, shipping_pickup: true,
    views_count: 34,
    images: [{ id: 6, image_url: null, is_primary: true }],
    created_at: '2026-02-08T10:00:00Z',
  },
  {
    id: 7, uuid: 'lst_007', seller_id: 2, seller: mockSeller,
    title: 'HP Laptop 15 Core i5',
    description: 'HP laptop core i5 8th gen, 8GB RAM, 512GB SSD. Very fast.',
    category: 'Electronics', condition: 'very_good', price: 28000000,
    status: 'active', state: 'Lagos', city: 'Yaba',
    shipping_park: true, shipping_gig: true, shipping_bolt_indrive: true, shipping_pickup: true,
    views_count: 89,
    images: [{ id: 7, image_url: null, is_primary: true }],
    created_at: '2026-02-09T12:00:00Z',
  },
  {
    id: 8, uuid: 'lst_008', seller_id: 2, seller: mockSeller,
    title: 'Binatone Blender',
    description: 'Binatone blender. Works perfectly. Selling because I got a new one.',
    category: 'Home Appliances', condition: 'good', price: 800000,
    status: 'active', state: 'Oyo', city: 'Ibadan',
    shipping_park: true, shipping_gig: true, shipping_bolt_indrive: false, shipping_pickup: true,
    views_count: 12,
    images: [{ id: 8, image_url: null, is_primary: true }],
    created_at: '2026-02-10T09:00:00Z',
  },
]

export const mockListing = {
  ...mockListings[0],
  description: 'Barely used Samsung 55 inch 4K Smart TV. Has Netflix, YouTube, and all major apps. Remote included. No dead pixels. Works perfectly. Selling because I just got a bigger one. Buyer can test before payment is released.',
  images: [
    { id: 1, image_url: null, is_primary: true, sort_order: 1 },
    { id: 2, image_url: null, is_primary: false, sort_order: 2 },
    { id: 3, image_url: null, is_primary: false, sort_order: 3 },
  ],
  gig_office_confirmed: true,
  bolt_available_confirmed: true,
}

export const mockMessages = [
  { id: 1, order_id: 1, sender_id: 2, sender: mockSeller, message_type: 'text', message: 'Hello, I have confirmed your order. I will ship tomorrow morning.', file_url: null, is_read: true, created_at: '2026-02-15T10:05:00Z' },
  { id: 2, order_id: 1, sender_id: 1, sender: mockUser, message_type: 'text', message: 'Thank you! Please let me know when you drop it off.', file_url: null, is_read: true, created_at: '2026-02-15T10:08:00Z' },
  { id: 3, order_id: 1, sender_id: 2, sender: mockSeller, message_type: 'text', message: 'GIG office is at 12 Admiralty Way Lekki. Cost is ₦1,500. Please pay GIG directly.', file_url: null, is_read: true, created_at: '2026-02-15T10:15:00Z' },
  { id: 4, order_id: 1, sender_id: 2, sender: mockSeller, message_type: 'dispatch_proof', message: 'Item dropped off at GIG Lekki. Tracking: GIG-2026-88821', file_url: null, is_read: true, created_at: '2026-02-16T09:00:00Z' },
  { id: 5, order_id: 1, sender_id: 1, sender: mockUser, message_type: 'text', message: 'Got it! I will confirm once I receive it.', file_url: null, is_read: true, created_at: '2026-02-16T09:10:00Z' },
]

export const mockOrder = {
  id: 1, uuid: 'ord_001',
  buyer_id: 1, seller_id: 2, listing_id: 1,
  buyer: mockUser, seller: mockSeller, listing: mockListings[0],
  status: 'in_transit',
  item_price: 18000000, platform_fee: 2700000, seller_payout: 15300000,
  shipping_method: 'gig',
  payment_reference: 'PAY-2026-001', payment_status: 'paid',
  escrow_status: 'held',
  seller_confirmed_at: '2026-02-15T10:00:00Z',
  dispatched_at: '2026-02-16T09:00:00Z',
  delivered_at: null, completed_at: null,
  auto_release_at: '2026-02-19T09:00:00Z',
  cancelled_at: null, cancel_reason: null,
  messages: mockMessages,
  created_at: '2026-02-14T16:00:00Z',
  updated_at: '2026-02-16T09:00:00Z',
}

export const mockOrders = [
  { ...mockOrder, id: 1, uuid: 'ord_001', status: 'in_transit', shipping_method: 'gig' },
  { ...mockOrder, id: 2, uuid: 'ord_002', status: 'awaiting_seller_confirmation', shipping_method: 'park_waybill' },
  { ...mockOrder, id: 3, uuid: 'ord_003', status: 'completed', shipping_method: 'bolt_indrive' },
  { ...mockOrder, id: 4, uuid: 'ord_004', status: 'disputed', shipping_method: 'gig' },
  { ...mockOrder, id: 5, uuid: 'ord_005', status: 'cancelled', shipping_method: 'local_pickup' },
  { ...mockOrder, id: 6, uuid: 'ord_006', status: 'shipping_coordination', shipping_method: 'park_waybill' },
]

export const mockDispute = {
  id: 1, uuid: 'dsp_001', order_id: 4,
  order: { ...mockOrder, status: 'disputed' },
  raised_by: 1,
  dispute_reason: 'Item Not As Described',
  buyer_evidence_description: 'The TV screen has a crack not shown in listing photos.',
  buyer_evidence_urls: [],
  seller_evidence_description: 'Item was in perfect condition when shipped. I have the handover photo.',
  seller_evidence_urls: [],
  status: 'under_review',
  resolution: null, resolution_note: null, resolved_by: null, resolved_at: null,
  messages: mockMessages,
  created_at: '2026-02-17T12:00:00Z',
  updated_at: '2026-02-17T12:00:00Z',
}

export const mockWalletTransactions = [
  { id: 1, type: 'credit', amount: 15300000, reference: 'ord_001', description: 'Order payment — Samsung TV', status: 'completed', created_at: '2026-02-16T10:00:00Z' },
  { id: 2, type: 'debit', amount: 5000000, reference: 'WDR-001', description: 'Withdrawal to GTBank', status: 'completed', created_at: '2026-02-14T09:00:00Z' },
  { id: 3, type: 'credit', amount: 8500000, reference: 'ord_002', description: 'Order payment — iPhone 13', status: 'completed', created_at: '2026-02-12T11:00:00Z' },
  { id: 4, type: 'credit', amount: 2125000, reference: 'ord_003', description: 'Order payment — Adidas Sneakers', status: 'completed', created_at: '2026-02-10T14:00:00Z' },
  { id: 5, type: 'debit', amount: 10000000, reference: 'WDR-002', description: 'Withdrawal to Zenith Bank', status: 'completed', created_at: '2026-02-08T16:00:00Z' },
]

export const mockWithdrawals = [
  { id: 1, amount: 5000000, bank_name: 'Guaranty Trust Bank', account_number: '0123456789', account_name: 'Victor Johnson', status: 'processed', processed_at: '2026-02-14T11:00:00Z', rejection_reason: null, created_at: '2026-02-14T09:00:00Z' },
  { id: 2, amount: 10000000, bank_name: 'Zenith Bank', account_number: '9876543210', account_name: 'Victor Johnson', status: 'processed', processed_at: '2026-02-08T18:00:00Z', rejection_reason: null, created_at: '2026-02-08T16:00:00Z' },
  { id: 3, amount: 3000000, bank_name: 'Access Bank', account_number: '1234567890', account_name: 'Victor Johnson', status: 'pending', processed_at: null, rejection_reason: null, created_at: '2026-02-20T10:00:00Z' },
]

export const mockNotifications = [
  { id: 1, type: 'order_placed', title: 'New Order', message: 'Someone just bought your Samsung TV listing', is_read: false, link: '/orders/1', created_at: '2026-02-14T16:00:00Z' },
  { id: 2, type: 'order_confirmed', title: 'Order Confirmed', message: 'Seller confirmed your order for Samsung TV', is_read: false, link: '/orders/1', created_at: '2026-02-15T10:00:00Z' },
  { id: 3, type: 'item_dispatched', title: 'Item Dispatched', message: 'Your Samsung TV has been dispatched via GIG', is_read: false, link: '/orders/1', created_at: '2026-02-16T09:00:00Z' },
  { id: 4, type: 'wallet_credit', title: 'Wallet Credited', message: '₦153,000 has been added to your wallet', is_read: true, link: '/wallet', created_at: '2026-02-16T10:00:00Z' },
  { id: 5, type: 'kyc_approved', title: 'KYC Approved', message: 'Your identity has been verified successfully', is_read: true, link: '/profile', created_at: '2026-01-16T12:00:00Z' },
]

export const mockAdminStats = {
  total_users: 1240, total_listings: 3876, total_orders: 892,
  gmv: 245600000, revenue: 36840000, open_disputes: 7,
  pending_withdrawals: 12, pending_kyc: 24,
  orders_per_day: [
    { date: '2026-02-01', count: 18 }, { date: '2026-02-02', count: 24 },
    { date: '2026-02-03', count: 31 }, { date: '2026-02-04', count: 22 },
    { date: '2026-02-05', count: 28 }, { date: '2026-02-06', count: 35 },
    { date: '2026-02-07', count: 40 },
  ],
  revenue_per_day: [
    { date: '2026-02-01', amount: 1200000 }, { date: '2026-02-02', amount: 1800000 },
    { date: '2026-02-03', amount: 2400000 }, { date: '2026-02-04', amount: 1600000 },
    { date: '2026-02-05', amount: 2100000 }, { date: '2026-02-06', amount: 2800000 },
    { date: '2026-02-07', amount: 3200000 },
  ],
}

export const mockAdminUsers = [
  { ...mockUser, id: 1 },
  { ...mockSeller, id: 2 },
  { id: 3, first_name: 'Chidi', last_name: 'Nwosu', email: 'chidi@example.com', phone: '08033334444', kyc_status: 'pending', role: 'buyer', trust_score: 0, total_sales: 0, is_banned: false, created_at: '2026-02-10T00:00:00Z' },
  { id: 4, first_name: 'Fatima', last_name: 'Bello', email: 'fatima@example.com', phone: '08055556666', kyc_status: 'verified', role: 'seller', trust_score: 4.2, total_sales: 8, is_banned: false, created_at: '2026-01-20T00:00:00Z' },
  { id: 5, first_name: 'Emeka', last_name: 'Eze', email: 'emeka@example.com', phone: '08077778888', kyc_status: 'rejected', role: 'buyer', trust_score: 0, total_sales: 0, is_banned: false, created_at: '2026-02-12T00:00:00Z' },
]
