import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Truck, Package, Zap, MapPin, Shield, CheckCircle2 } from 'lucide-react'
import { formatNaira } from '../../utils/formatters.js'
import { walletCheckout } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../ui/Toast.jsx'

const SHIPPING_OPTIONS = [
  { key: 'park_waybill',  field: 'shipping_park',         icon: Truck,   label: 'Park Waybill',   desc: 'Same day to 2 days. Pay delivery provider on receipt.' },
  { key: 'gig',           field: 'shipping_gig',          icon: Package, label: 'GIG Logistics',  desc: 'Seller shares GIG waybill amount in chat.' },
  { key: 'bolt_indrive',  field: 'shipping_bolt_indrive', icon: Zap,     label: 'Bolt / InDrive', desc: 'Same day. Buyer pays rider on receipt.' },
  { key: 'local_pickup',  field: 'shipping_pickup',       icon: MapPin,  label: 'Local Pickup',   desc: 'Free OTP handover' },
]

export default function CheckoutModal({ isOpen, onClose, listing }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [selectedShipping, setSelectedShipping] = useState('')
  const [loading, setLoading]   = useState(false)
  const [order, setOrder]       = useState(null)
  const [done, setDone]         = useState(false)

  if (!isOpen || !listing) return null

  const available  = SHIPPING_OPTIONS.filter((o) => listing[o.field])
  const itemPrice  = listing.price || 0

  async function handleConfirm() {
    if (!selectedShipping) return
    if (!user?.phone_verified) {
      showToast('Verify your phone number before placing an order.', 'error')
      onClose()
      navigate(`/profile/${user?.id}`)
      return
    }
    if ((user?.wallet_balance ?? 0) < itemPrice) {
      showToast('Insufficient wallet balance. Please fund your wallet to continue.', 'error')
      onClose()
      navigate('/wallet')
      return
    }
    setLoading(true)
    try {
      const result = await walletCheckout({ listing_id: listing.id, shipping_method: selectedShipping })
      setOrder(result)
      setDone(true)
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Payment failed. Please try again.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSelectedShipping('')
    setOrder(null)
    setDone(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md z-10 max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-sm font-semibold text-gray-900">
            {done ? 'Order Placed' : 'Complete Purchase'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={17} />
          </button>
        </div>

        {!done ? (
          <div className="p-5 space-y-5">
            {/* Item */}
            <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0 overflow-hidden">
                {listing.images?.[0]?.image_url && (
                  <img src={listing.images[0].image_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{listing.title}</p>
                <p className="text-sm font-bold text-brand-500 mt-0.5">{formatNaira(listing.price)}</p>
              </div>
            </div>

            {/* Shipping */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping Method</p>
              <div className="space-y-2">
                {available.map(({ key, icon, label, desc }) => {
                  const ShippingIcon = icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedShipping(key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedShipping === key
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        selectedShipping === key ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <ShippingIcon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      {selectedShipping === key && <CheckCircle2 size={15} className="shrink-0 text-brand-500" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedShipping === 'gig' && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-red-700">Do not pay GIG fees to the seller.</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">
                  The seller will drop off the item at GIG and share the official waybill amount in chat. Pay the delivery fee directly to GIG Logistics only.
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Summary</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Item price held in escrow</span>
                <span>{formatNaira(itemPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery fee</span>
                <span>Paid outside PayClutr</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-sm font-semibold text-gray-900">Escrow total</span>
                <span className="text-sm font-bold text-brand-500">{formatNaira(itemPrice)}</span>
              </div>
              <p className="text-[10px] text-gray-400">Delivery costs are not included in the wallet payment.</p>
            </div>

            {/* CTA */}
            <button
              onClick={handleConfirm}
              disabled={!selectedShipping || loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing…
                </span>
              ) : 'Confirm & Pay'}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Shield size={11} />
              <span>Payment held in escrow until delivery confirmed</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Order Placed!</h3>
            <p className="text-sm text-gray-400 mb-5">Your payment is held in escrow until you confirm receipt.</p>
            <div className="space-y-2">
              <button onClick={() => { handleClose(); navigate(`/orders/${order?.id}`) }} className="btn-primary w-full justify-center">
                View Order
              </button>
              <button onClick={handleClose} className="btn-secondary w-full justify-center">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
