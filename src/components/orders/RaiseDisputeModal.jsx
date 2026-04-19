import { useState, useRef } from 'react'
import { X, Upload, ImagePlus, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { raiseDispute } from '../../api/endpoints.js'
import LoadingButton from '../ui/LoadingButton.jsx'

const REASONS = [
  'Item Not As Described',
  'Item Not Received',
  'Item Damaged in Transit',
  'Seller Unresponsive',
]

export default function RaiseDisputeModal({ isOpen, onClose, orderId }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [previews, setPreviews] = useState([])

  const mutation = useMutation({
    mutationFn: (data) => raiseDispute(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', String(orderId)])
      onClose()
    },
  })

  const handleFiles = (files) => {
    const selected = Array.from(files).slice(0, 5 - previews.length)
    const newPreviews = selected.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    setPreviews((p) => [...p, ...newPreviews].slice(0, 5))
  }

  const removePreview = (idx) => {
    setPreviews((p) => {
      URL.revokeObjectURL(p[idx].url)
      return p.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = () => {
    if (!reason || description.trim().length < 20) return
    mutation.mutate({ reason, description, evidence: previews.map((p) => p.file) })
  }

  const canSubmit = reason && description.trim().length >= 20 && description.trim().length <= 500

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !mutation.isPending && onClose()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg z-10 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Raise a Dispute</h2>
              <p className="text-xs text-gray-500 mt-0.5">Our team will review within 24–48 hours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dispute reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="">Select a reason…</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. What happened? What were you expecting?"
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            <div className="flex justify-between mt-1">
              {description.trim().length > 0 && description.trim().length < 20 ? (
                <p className="text-xs text-red-500">Minimum 20 characters</p>
              ) : (
                <span />
              )}
              <p className={`text-xs ml-auto ${description.length > 480 ? 'text-amber-600' : 'text-gray-400'}`}>
                {description.length}/500
              </p>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Evidence photos <span className="text-gray-400 font-normal">(up to 5)</span>
            </label>

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePreview(idx)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors w-full justify-center"
              >
                <ImagePlus size={16} />
                {previews.length === 0 ? 'Add photos' : 'Add more'}
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <LoadingButton
            onClick={handleSubmit}
            isLoading={mutation.isPending}
            disabled={!canSubmit}
            className="btn-primary"
          >
            Submit Dispute
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
