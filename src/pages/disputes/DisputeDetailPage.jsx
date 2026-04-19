import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, ShieldAlert, User, Calendar, FileText,
  CheckCircle, Clock, Eye, AlertCircle, Image as ImageIcon,
} from 'lucide-react'
import {
  getDispute, getDisputeMessages, sendDisputeMessage, submitEvidence,
} from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatNaira, formatDate, formatTimeAgo, formatShipping } from '../../utils/formatters.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

const DISPUTE_STATUS_LABELS = {
  open: 'Open', under_review: 'Under Review', resolved: 'Resolved', closed: 'Closed',
}

const DISPUTE_REASON_LABELS = {
  item_not_received:     'Item Not Received',
  item_not_as_described: 'Item Not as Described',
  wrong_item_sent:       'Wrong Item Sent',
  damaged_item:          'Damaged Item',
  seller_unresponsive:   'Seller Unresponsive',
  other:                 'Other',
}

function disputeStatusClass(status) {
  switch (status) {
    case 'open':         return 'bg-amber-50 text-amber-700'
    case 'under_review': return 'bg-blue-50 text-blue-700'
    case 'resolved':     return 'bg-green-50 text-green-700'
    default:             return 'bg-gray-100 text-gray-600'
  }
}

function OrderSummaryCard({ order }) {
  if (!order) return null
  const { listing, buyer, seller, shipping_method } = order
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Summary</h2>
      <div className="flex gap-4">
        {listing?.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0">
            <ImageIcon size={22} className="text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{listing?.title || 'Listing'}</p>
          <p className="text-brand-600 font-semibold text-sm mt-0.5">
            {listing?.price != null ? formatNaira(listing.price) : '—'}
          </p>
          {shipping_method && (
            <p className="text-xs text-gray-400 mt-1">Shipping: {formatShipping(shipping_method)}</p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
        {[['Buyer', buyer], ['Seller', seller]].map(([label, person]) => (
          <div key={label}>
            <p className="text-xs text-gray-400 mb-1.5">{label}</p>
            <div className="flex items-center gap-2">
              <UserAvatar user={person} size="sm" />
              <span className="text-sm text-gray-900 font-medium">{person?.first_name} {person?.last_name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DisputeInfoCard({ dispute }) {
  const { raised_by, reason, description, created_at } = dispute
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Dispute Details</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <User size={15} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400">Raised By</p>
            <div className="flex items-center gap-2 mt-1">
              <UserAvatar user={raised_by} size="sm" />
              <span className="text-sm text-gray-900 font-medium">{raised_by?.first_name} {raised_by?.last_name}</span>
            </div>
          </div>
        </div>
        {reason && (
          <div className="flex items-start gap-3">
            <AlertCircle size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Reason</p>
              <p className="text-sm text-gray-900 mt-0.5">{DISPUTE_REASON_LABELS[reason] || reason}</p>
            </div>
          </div>
        )}
        {description && (
          <div className="flex items-start gap-3">
            <FileText size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        )}
        {created_at && (
          <div className="flex items-start gap-3">
            <Calendar size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Raised On</p>
              <p className="text-sm text-gray-900 mt-0.5">{formatDate(created_at)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <UserAvatar user={msg.sender} size="sm" className="shrink-0 mb-1" />
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}>
          {msg.message}
        </div>
        <div className={`flex items-center gap-1.5 text-xs text-gray-400 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span>{msg.sender?.first_name}</span>
          <span>·</span>
          <span>{formatTimeAgo(msg.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function MessagesTab({ disputeId, currentUser }) {
  const queryClient = useQueryClient()
  const [messageText, setMessageText] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['dispute-messages', disputeId],
    queryFn: () => getDisputeMessages(disputeId).then((r) => r.data),
    refetchInterval: 10000,
  })

  const sendMutation = useMutation({
    mutationFn: (data) => sendDisputeMessage(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-messages', disputeId] })
      setMessageText('')
      textareaRef.current?.focus()
    },
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = () => {
    const trimmed = messageText.trim()
    if (!trimmed || sendMutation.isPending) return
    sendMutation.mutate({ message: trimmed })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ minHeight: 480 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex items-end gap-2 animate-pulse ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                <div className={`h-10 rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'w-1/2' : 'w-2/3'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <ShieldAlert size={28} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={msg.id || idx} msg={msg} isOwn={msg.sender?.id === currentUser?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-100 p-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          style={{ maxHeight: 120, overflowY: 'auto' }}
          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px` }}
        />
        <button
          onClick={handleSend}
          disabled={!messageText.trim() || sendMutation.isPending}
          className="w-10 h-10 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 transition-colors shrink-0 flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

function EvidenceTab({ disputeId, dispute, currentUser }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [evidenceText, setEvidenceText] = useState('')

  const { order, buyer_evidence_description, buyer_evidence_urls, seller_evidence_description, seller_evidence_urls, status } = dispute
  const buyer  = order?.buyer
  const seller = order?.seller
  const isBuyer  = currentUser?.id === buyer?.id
  const isSeller = currentUser?.id === seller?.id
  const isResolved = status === 'resolved' || status === 'closed'
  const hasSubmitted = isBuyer ? !!buyer_evidence_description : isSeller ? !!seller_evidence_description : true
  const canSubmit = (isBuyer || isSeller) && !hasSubmitted && !isResolved

  const evidenceMutation = useMutation({
    mutationFn: (data) => submitEvidence(disputeId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] }); setEvidenceText(''); showToast('Evidence submitted', 'success') },
    onError: () => showToast('Failed to submit evidence. Please try again.', 'error'),
  })

  const EvidenceCol = ({ title, description, urls, emptyLabel }) => (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {description ? (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-sm text-gray-700 leading-relaxed">
          <p>{description}</p>
          {urls?.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-600 text-xs underline underline-offset-2 hover:text-brand-700">
                  <Eye size={12} /> View attachment {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} />
          {emptyLabel || 'No evidence submitted yet'}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Submitted Evidence</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <EvidenceCol title="Buyer Evidence" description={buyer_evidence_description} urls={buyer_evidence_urls} emptyLabel="Buyer has not submitted evidence yet" />
          <div className="hidden sm:block w-px bg-gray-100 shrink-0" />
          <EvidenceCol title="Seller Evidence" description={seller_evidence_description} urls={seller_evidence_urls} emptyLabel="Seller has not submitted evidence yet" />
        </div>
      </div>

      {canSubmit && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Submit Your Evidence</h2>
          <p className="text-xs text-gray-400 mb-4">You can only submit evidence once. Make sure your description is complete.</p>
          <form onSubmit={(e) => { e.preventDefault(); const t = evidenceText.trim(); if (!t || evidenceMutation.isPending) return; evidenceMutation.mutate({ evidence_description: t, evidence_urls: [] }) }} className="space-y-3">
            <textarea
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder="Describe what happened, what evidence you have, and any other relevant details…"
              rows={5}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={!evidenceText.trim() || evidenceMutation.isPending} className="btn-primary">
                {evidenceMutation.isPending ? 'Submitting…' : 'Submit Evidence'}
              </button>
            </div>
          </form>
        </div>
      )}

      {(isBuyer || isSeller) && hasSubmitted && !isResolved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl text-sm text-brand-600">
          <CheckCircle size={15} className="shrink-0" />
          You have already submitted your evidence for this dispute.
        </div>
      )}
    </div>
  )
}

export default function DisputeDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('messages')

  const { data: dispute, isLoading, isError } = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => getDispute(id).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-6 bg-gray-200 rounded w-48" />
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="h-56 bg-gray-100 rounded-xl" />
    </div>
  )

  if (isError || !dispute) return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Orders
      </Link>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert size={36} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Dispute not found</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">This dispute does not exist or you don't have permission to view it.</p>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    </div>
  )

  const { status, resolution, resolved_at } = dispute

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-brand-600 shrink-0" />
          <h1 className="text-xl font-semibold text-gray-900">Dispute #{id}</h1>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${disputeStatusClass(status)}`}>
          {DISPUTE_STATUS_LABELS[status] || status}
        </span>
      </div>

      {status === 'resolved' && (
        <div className="flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm">
          <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Dispute Resolved</p>
            {resolution && <p className="text-green-700 mt-0.5">{resolution}</p>}
            {resolved_at && <p className="text-green-600 text-xs mt-1">{formatDate(resolved_at)}</p>}
          </div>
        </div>
      )}

      <OrderSummaryCard order={dispute.order} />
      <DisputeInfoCard dispute={dispute} />

      <div>
        <div className="flex gap-1 border-b border-gray-100 mb-4">
          {[{ key: 'messages', label: 'Messages' }, { key: 'evidence', label: 'Evidence' }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === 'messages' && <MessagesTab disputeId={id} currentUser={user} />}
        {activeTab === 'evidence' && <EvidenceTab disputeId={id} dispute={dispute} currentUser={user} />}
      </div>
    </div>
  )
}
