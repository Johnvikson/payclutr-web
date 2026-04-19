import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { getDispute, resolveDispute } from '../../api/endpoints.js'
import { formatDate, formatNaira } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

const RULINGS = [
  { value: 'buyer_wins',   label: 'Buyer Wins',   activeClass: 'border-blue-300 bg-blue-50' },
  { value: 'seller_wins',  label: 'Seller Wins',  activeClass: 'border-green-300 bg-green-50' },
  { value: 'partial',      label: 'Partial',      activeClass: 'border-yellow-300 bg-yellow-50' },
]

export default function AdminDisputeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()

  const [ruling, setRuling] = useState('')
  const [note, setNote] = useState('')

  const { data: dispute } = useQuery({ queryKey: ['admin-dispute', id], queryFn: () => getDispute(id) })

  const mutResolve = useMutation({
    mutationFn: () => resolveDispute(id, { resolution: ruling, note }),
    onSuccess: () => { qc.invalidateQueries(['admin-dispute', id]); showToast('Dispute resolved', 'success') },
  })

  if (!dispute) return null

  const { order } = dispute

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/admin/disputes')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Disputes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Order</span><span className="font-medium">{order?.uuid}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Item</span><span className="font-medium truncate ml-4 text-right">{order?.listing?.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatNaira(order?.item_price ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={order?.status} /></div>
            </div>
          </div>

          {/* Order chat */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={16} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Order Chat</p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(order?.messages ?? []).map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_id === order?.buyer_id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                    msg.sender_id === order?.buyer_id
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-brand-50 text-gray-800'
                  }`}>
                    <p className="font-medium text-gray-500 mb-0.5">{msg.sender?.first_name}</p>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Dispute summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Dispute Summary</p>
              <StatusBadge status={dispute.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Reason</span><span className="font-medium">{dispute.dispute_reason}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Raised</span><span>{formatDate(dispute.created_at)}</span></div>
            </div>
          </div>

          {/* Buyer evidence */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <UserAvatar user={order?.buyer} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Buyer Evidence</p>
                <p className="text-xs text-gray-400">{order?.buyer?.first_name} {order?.buyer?.last_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {dispute.buyer_evidence_description || 'No evidence submitted yet.'}
            </p>
          </div>

          {/* Seller evidence */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <UserAvatar user={order?.seller} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Seller Evidence</p>
                <p className="text-xs text-gray-400">{order?.seller?.first_name} {order?.seller?.last_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {dispute.seller_evidence_description || 'No evidence submitted yet.'}
            </p>
          </div>

          {/* Resolution form */}
          {dispute.status !== 'resolved' && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Ruling</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {RULINGS.map(({ value, label, activeClass }) => (
                  <button
                    key={value}
                    onClick={() => setRuling(value)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      ruling === value ? activeClass : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain the resolution decision..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={() => mutResolve.mutate()}
                disabled={!ruling || note.length < 20 || mutResolve.isPending}
                className="mt-3 w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {mutResolve.isPending ? 'Confirming…' : 'Confirm Ruling'}
              </button>
              {note.length > 0 && note.length < 20 && (
                <p className="text-xs text-red-500 mt-1">Minimum 20 characters required</p>
              )}
            </div>
          )}

          {/* Resolved state */}
          {dispute.status === 'resolved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800">Dispute Resolved</p>
              {dispute.resolution && <p className="text-xs text-green-700 mt-1 capitalize">{dispute.resolution.replace('_', ' ')}</p>}
              {dispute.resolution_note && <p className="text-xs text-green-600 mt-1">{dispute.resolution_note}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
