import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Check, Clock, Package, Truck, Star, Copy, Send,
  Paperclip, ShieldCheck, AlertTriangle, Info, ChevronRight,
} from 'lucide-react'
import {
  getOrder, getOrderMessages, sendMessage,
  confirmOrder, cancelOrder, confirmDelivery,
  uploadDispatchProof, generateOtp, submitRating,
} from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatDate, formatShipping } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import RaiseDisputeModal from '../../components/orders/RaiseDisputeModal.jsx'
import LoadingButton from '../../components/ui/LoadingButton.jsx'

const STEPS = [
  { key: 'placed',       label: 'Order Placed' },
  { key: 'confirmed',    label: 'Confirmed' },
  { key: 'coordinating', label: 'Shipping' },
  { key: 'in_transit',   label: 'In Transit' },
  { key: 'done',         label: 'Completed' },
]

const SHIPPING_PAYMENT_NOTES = {
  park_waybill: {
    tone: 'amber',
    title: 'Park Waybill delivery fee is paid outside escrow',
    body: 'Buyer and seller should agree waybill details in chat. The buyer pays the delivery provider when the item is received.',
  },
  gig: {
    tone: 'red',
    title: 'Do not pay GIG delivery fees to the seller',
    body: 'The seller should drop the item at GIG Logistics and share the official waybill amount in chat. Buyer must pay the delivery fee directly to GIG Logistics only.',
  },
  bolt_indrive: {
    tone: 'amber',
    title: 'Bolt / InDrive fee is paid to the rider',
    body: 'Buyer pays the Bolt or InDrive rider directly when the product is received. The fee is not part of PayClutr escrow.',
  },
}

function statusToStep(status) {
  switch (status) {
    case 'awaiting_seller_confirmation': return 1
    case 'shipping_coordination':        return 2
    case 'in_transit':                   return 3
    case 'completed':                    return 4
    case 'cancelled':                    return -1
    case 'disputed':                     return 3
    default:                             return 0
  }
}

function ShippingPaymentNotice({ method, compact = false }) {
  const note = SHIPPING_PAYMENT_NOTES[method]
  if (!note) return null
  const isDanger = note.tone === 'red'

  return (
    <div
      className={[
        'flex items-start gap-2 rounded-xl border',
        compact ? 'px-3 py-2' : 'p-4',
        isDanger
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
          : 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
      ].join(' ')}
    >
      <AlertTriangle size={compact ? 14 : 16} className="mt-0.5 shrink-0" />
      <div>
        <p className={compact ? 'text-xs font-semibold' : 'text-sm font-semibold'}>{note.title}</p>
        <p className={compact ? 'text-xs mt-0.5 leading-relaxed' : 'text-sm mt-1 leading-relaxed'}>{note.body}</p>
      </div>
    </div>
  )
}

function Stepper({ status }) {
  const current = statusToStep(status)
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
        <AlertTriangle size={16} />
        This order was cancelled
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const done   = idx < current
        const active = idx === current
        const isLast = idx === STEPS.length - 1

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done   ? 'bg-brand-500 text-white'
                : active ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={13} /> : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${
                done || active ? 'text-gray-700 font-medium' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${
                done ? 'bg-brand-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function WaitBox({ message }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}

function MessageBubble({ msg, isMe }) {
  if (msg.message_type === 'dispatch_proof') {
    return (
      <div className="flex justify-center">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center max-w-xs">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Truck size={14} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Dispatch Proof</span>
          </div>
          <p className="text-sm text-gray-700">{msg.message}</p>
          {msg.file_url && (
            <a href={msg.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">
              View receipt
            </a>
          )}
        </div>
      </div>
    )
  }

  if (msg.message_type === 'driver_info') {
    return (
      <div className="flex justify-center">
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-center max-w-xs">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Info size={14} className="text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Driver Info</span>
          </div>
          <p className="text-sm text-gray-700">{msg.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && <UserAvatar user={msg.sender} size="xs" className="shrink-0 mb-0.5" />}
      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm ${
        isMe
          ? 'bg-brand-500 text-white rounded-br-sm'
          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
      }`}>
        <p className="leading-snug">{msg.message}</p>
        <p className={`text-[10px] mt-1 ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
          {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function OrderChat({ userId, messages = [], isSending, onSend, shippingMethod }) {
  const [text, setText] = useState('')
  const fileRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Order Chat</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Messages stay on-platform for security</p>
        <div className="mt-2">
          <ShippingPaymentNotice method={shippingMethod} compact />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[420px]">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === userId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 dark:border-zinc-800 px-3 py-3 flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors shrink-0"
        >
          <Paperclip size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 focus:outline-none focus:border-brand dark:focus:border-brand transition-colors"
          style={{ minHeight: 38 }}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || isSending}
          className="p-2 rounded-lg bg-brand hover:bg-brand-600 text-white transition-colors disabled:opacity-40 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

function OtpModal({ isOpen, onClose }) {
  const [otp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString())
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60)

  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const secs = (timeLeft % 60).toString().padStart(2, '0')

  const copyOtp = () => {
    navigator.clipboard.writeText(otp).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={24} className="text-brand-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Your Delivery OTP</h2>
        <p className="text-sm text-gray-500 mb-5">Share this code with the buyer to confirm local pickup</p>

        <div className="flex items-center justify-center gap-2 mb-3">
          {otp.split('').map((digit, i) => (
            <div key={i} className="w-10 h-12 rounded-lg border-2 border-brand-200 bg-brand-50 flex items-center justify-center text-xl font-bold text-brand-600">
              {digit}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-5">
          <Clock size={13} className={timeLeft < 60 ? 'text-red-500' : 'text-gray-400'} />
          <span className={`text-sm font-medium ${timeLeft < 60 ? 'text-red-500' : 'text-gray-500'}`}>
            {timeLeft === 0 ? 'OTP expired' : `Expires in ${mins}:${secs}`}
          </span>
        </div>

        <button
          onClick={copyOtp}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-3"
        >
          <Copy size={14} />
          {copied ? 'Copied!' : 'Copy OTP'}
        </button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}

function RatingWidget({ orderId, otherParty }) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: (data) => submitRating(orderId, data),
    onSuccess: () => {
      setSubmitted(true)
      queryClient.invalidateQueries(['order', String(orderId)])
    },
  })

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
          <Check size={20} className="text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-900">Review submitted!</p>
        <p className="text-xs text-gray-500 mt-0.5">Thank you for your feedback</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Rate {otherParty?.first_name}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} className="p-1">
            <Star size={22} className={`transition-colors ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Leave a review (optional)"
        rows={2}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 resize-none focus:outline-none focus:border-brand-500 transition-colors"
      />
      <LoadingButton
        onClick={() => mutation.mutate({ rating, review, target_user_id: otherParty?.id })}
        isLoading={mutation.isPending}
        disabled={!rating}
        className="btn-primary w-full"
      >
        Submit Review
      </LoadingButton>
    </div>
  )
}

function ActionArea({ order, role, onRaiseDispute }) {
  const queryClient = useQueryClient()
  const [showOtp, setShowOtp] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const fileRef = useRef(null)

  const confirm  = useMutation({ mutationFn: () => confirmOrder(order.id),           onSuccess: () => queryClient.invalidateQueries(['order', String(order.id)]) })
  const cancel   = useMutation({ mutationFn: () => cancelOrder(order.id, cancelReason), onSuccess: () => { queryClient.invalidateQueries(['order', String(order.id)]); setShowCancel(false) } })
  const delivery = useMutation({ mutationFn: () => confirmDelivery(order.id),         onSuccess: () => queryClient.invalidateQueries(['order', String(order.id)]) })
  const dispatch = useMutation({ mutationFn: (data) => uploadDispatchProof(order.id, data), onSuccess: () => queryClient.invalidateQueries(['order', String(order.id)]) })
  const genOtp   = useMutation({ mutationFn: () => generateOtp(order.id),             onSuccess: () => setShowOtp(true) })

  const handleFileUpload = (e) => { const file = e.target.files?.[0]; if (!file) return; dispatch.mutate({ file }) }

  const { status, shipping_method } = order
  const isBuyer  = role === 'buyer'
  const isSeller = role === 'seller'

  if (status === 'awaiting_seller_confirmation') {
    if (isSeller) return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-1">New Order — Action Required</p>
          <p className="text-sm text-amber-700">You have 24 hours to confirm or cancel this order.</p>
        </div>
        <div className="flex gap-3">
          <LoadingButton onClick={() => confirm.mutate()} isLoading={confirm.isPending} className="btn-primary flex-1">
            <Check size={15} /> Accept Order
          </LoadingButton>
          <button onClick={() => setShowCancel(true)} className="flex-1 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Cancel
          </button>
        </div>
        {showCancel && (
          <div className="space-y-2 p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm font-medium text-red-700">Reason for cancellation</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={2} placeholder="Tell the buyer why you're cancelling…" className="w-full text-sm px-3 py-2 rounded-lg border border-red-200 bg-white resize-none focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowCancel(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Go back</button>
              <LoadingButton onClick={() => cancel.mutate()} isLoading={cancel.isPending} disabled={!cancelReason.trim()} className="flex-1 btn-danger">Confirm Cancel</LoadingButton>
            </div>
          </div>
        )}
      </div>
    )
    return <WaitBox message="Waiting for the seller to accept your order. You'll be notified within 24 hours." />
  }

  if (status === 'shipping_coordination') {
    if (isSeller) {
      const infos = {
        park_waybill:   { color: 'blue',   label: 'Drop the item off at an agreed park terminal. Share the waybill number with the buyer in chat, then upload proof.', btn: 'Upload Waybill Proof', icon: Package },
        gig:            { color: 'blue',   label: 'Drop the item at the nearest GIG Logistics office. Share the tracking number with the buyer, then upload your receipt.', btn: 'Upload GIG Receipt', icon: Truck },
        bolt_indrive:   { color: 'purple', label: "Book a Bolt or InDrive rider. Share the driver's name and phone with the buyer in chat.", btn: 'Mark as Dispatched', icon: Truck },
        local_pickup:   { color: 'green',  label: 'Agree on a meeting point with the buyer. At handover, generate an OTP to release payment.', btn: 'Generate Handover OTP', icon: ShieldCheck },
      }
      const info = infos[shipping_method]
      if (!info) return null
      const BtnIcon = info.icon
      const isOtp = shipping_method === 'local_pickup'
      return (
        <div className="space-y-3">
          <div className={`p-4 bg-${info.color}-50 border border-${info.color}-100 rounded-xl`}>
            <p className={`text-sm text-${info.color}-700`}>{info.label}</p>
          </div>
          {!isOtp && <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />}
          <LoadingButton onClick={isOtp ? () => genOtp.mutate() : () => fileRef.current?.click()} isLoading={isOtp ? genOtp.isPending : dispatch.isPending} className="btn-primary w-full">
            <BtnIcon size={15} /> {info.btn}
          </LoadingButton>
          {isOtp && <OtpModal isOpen={showOtp} onClose={() => setShowOtp(false)} />}
        </div>
      )
    }
    return <WaitBox message="The seller is arranging shipment. You'll be notified when your item is on the way." />
  }

  if (status === 'in_transit') {
    if (isBuyer) return (
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm font-semibold text-blue-800 mb-1">Item is on the way</p>
          <p className="text-sm text-blue-700">Once you receive and inspect the item, confirm delivery to release payment. Funds release automatically in 72 hours if you don't act.</p>
        </div>
        <ShippingPaymentNotice method={shipping_method} />
        <LoadingButton onClick={() => delivery.mutate()} isLoading={delivery.isPending} className="btn-primary w-full">
          <Check size={15} /> Confirm Delivery
        </LoadingButton>
        <button onClick={onRaiseDispute} className="w-full py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
          Raise a Dispute
        </button>
      </div>
    )
    return <WaitBox message="The item is in transit. Payment will be released once the buyer confirms delivery or after 72 hours." />
  }

  if (status === 'completed') {
    const otherParty = role === 'buyer' ? order.seller : order.buyer
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
          <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Order Completed</p>
            <p className="text-sm text-green-700 mt-0.5">
              {role === 'buyer' ? 'Payment has been released to the seller.' : `₦${(order.seller_payout / 100).toLocaleString('en-NG')} has been added to your wallet.`}
            </p>
          </div>
        </div>
        <RatingWidget orderId={order.id} otherParty={otherParty} />
      </div>
    )
  }

  if (status === 'disputed') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">Dispute Under Review</p>
        </div>
        <p className="text-sm text-amber-700">Our team is reviewing this dispute. Funds are held securely until resolution. We'll notify both parties within 24–48 hours.</p>
        {order.dispute_id && (
          <Link to={`/disputes/${order.dispute_id}`} className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 underline mt-1">
            View dispute <ChevronRight size={14} />
          </Link>
        )}
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
        <p className="text-sm font-semibold text-red-800 mb-1">Order Cancelled</p>
        <p className="text-sm text-red-700">
          {order.cancel_reason || 'This order was cancelled.'}
          {role === 'buyer' && ' Your payment will be refunded within 1–3 business days.'}
        </p>
      </div>
    )
  }

  return null
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showDispute, setShowDispute] = useState(false)

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['order-messages', id],
    queryFn: () => getOrderMessages(id),
    refetchInterval: 10000,
  })

  const sendMsg = useMutation({
    mutationFn: (text) => sendMessage(id, { message: text, message_type: 'text' }),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['order-messages', id], (old = []) => [...old, newMsg])
    },
  })

  if (orderLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="h-64 bg-gray-100 rounded-xl" />
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!order) return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center">
      <p className="text-gray-500">Order not found.</p>
    </div>
  )

  const role  = order.buyer?.id === user?.id ? 'buyer' : 'seller'
  const img   = order.listing?.images?.[0]?.image_url
  const other = role === 'buyer' ? order.seller : order.buyer

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Order #{order.uuid || order.id}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={order.status} />
            <span className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(order.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 mb-6">
        <Stepper status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {/* Item card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-800">
              {img ? (
                <img src={img} alt={order.listing?.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={32} className="text-gray-300 dark:text-zinc-600" />
                </div>
              )}
            </div>
            <div className="p-4">
              <Link to={`/listings/${order.listing?.id}`} className="text-sm font-semibold text-gray-900 dark:text-zinc-100 hover:text-brand transition-colors line-clamp-2">
                {order.listing?.title}
              </Link>
              <p className="text-lg font-bold text-brand mt-1">{formatNaira(order.item_price)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Truck size={12} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-xs text-gray-500 dark:text-zinc-400">{formatShipping(order.shipping_method)}</span>
              </div>
            </div>
          </div>

          {/* Fee breakdown — buyer sees simple total; seller sees deduction */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">Payment Summary</p>
            {role === 'seller' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Item price</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-200">{formatNaira(order.item_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Service fee</span>
                  <span className="font-medium text-red-500">−{formatNaira(order.platform_fee)}</span>
                </div>
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-2.5 flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">You receive</span>
                  <span className="font-bold text-gray-900 dark:text-zinc-100">{formatNaira(order.seller_payout)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Amount paid</span>
                <span className="font-bold text-gray-900 dark:text-zinc-100">{formatNaira(order.item_price)}</span>
              </div>
            )}
          </div>

          <ShippingPaymentNotice method={order.shipping_method} />

          {/* Escrow badge */}
          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl">
            <ShieldCheck size={20} className="text-brand shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">Escrow Protection</p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">Only the item price is held. Delivery fees are paid directly to the carrier.</p>
            </div>
          </div>

          {/* Other party */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-3">
              {role === 'buyer' ? 'Seller' : 'Buyer'}
            </p>
            <div className="flex items-center gap-3">
              <UserAvatar user={other} size="md" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{other?.first_name} {other?.last_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs text-gray-500 dark:text-zinc-400">{other?.trust_score?.toFixed(1) ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <ActionArea order={order} role={role} onRaiseDispute={() => setShowDispute(true)} />
        </div>

        <div className="lg:col-span-2">
          <OrderChat
            userId={user?.id}
            messages={messages}
            isSending={sendMsg.isPending}
            onSend={(text) => sendMsg.mutate(text)}
            shippingMethod={order.shipping_method}
          />
        </div>
      </div>

      <RaiseDisputeModal
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
        orderId={order.id}
      />
    </div>
  )
}
