import { useState, useRef } from 'react'
import { ShieldCheck, Clock, AlertCircle, Camera, Upload, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function KycPage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [idType, setIdType] = useState('bvn')
  const [idNumber, setIdNumber] = useState('')
  const [idError, setIdError] = useState('')
  const [selfie, setSelfie] = useState(null) // { file, preview }
  const [selfieError, setSelfieError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(user?.kyc_status === 'pending')

  const kycStatus = user?.kyc_status // 'unverified' | 'pending' | 'verified' | 'rejected'

  function handleIdNumberChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11)
    setIdNumber(val)
    setIdError('')
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setSelfieError('Please upload an image file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setSelfieError('Image must be less than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setSelfie({ file, preview: ev.target.result })
    reader.readAsDataURL(file)
    setSelfieError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    let valid = true

    if (!idNumber || idNumber.length !== 11) {
      setIdError(`${idType.toUpperCase()} must be exactly 11 digits`)
      valid = false
    }
    if (!selfie) {
      setSelfieError('Please upload a selfie photo')
      valid = false
    }
    if (!valid) return

    setLoading(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
    updateUser({ kyc_status: 'pending' })
    setSubmitted(true)
    showToast('KYC documents submitted successfully!', 'success')
  }

  // Verified state
  if (kycStatus === 'verified') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <PageHeader />
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-status-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={30} className="text-status-success" />
          </div>
          <h2 className="text-xl font-bold text-content-primary mb-2">Identity Verified</h2>
          <p className="text-sm text-content-secondary">
            Your identity has been verified successfully. You can now buy and sell on PayClutr.
          </p>
        </div>
      </div>
    )
  }

  // Pending state (after submit or already pending)
  if (submitted || kycStatus === 'pending') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <PageHeader />
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-status-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Clock size={30} className="text-status-warning" />
          </div>
          <h2 className="text-xl font-bold text-content-primary mb-2">Verification Under Review</h2>
          <p className="text-sm text-content-secondary leading-relaxed">
            Our team is reviewing your documents. This usually takes less than 24 hours. We'll notify you once your identity is confirmed.
          </p>
          <div className="mt-6 py-3 px-4 bg-surface-secondary rounded-lg text-xs text-content-tertiary">
            You cannot resubmit while your documents are under review.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <PageHeader />

      {/* Rejected banner */}
      {kycStatus === 'rejected' && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-status-error">Verification Rejected</p>
            <p className="text-xs text-status-error/80 mt-0.5">
              Your previous submission was rejected. Please resubmit with clear, valid documents.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Identity Document */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-content-primary mb-1">Identity Document</h2>
          <p className="text-xs text-content-tertiary mb-5">
            Provide your BVN or NIN for identity verification.
          </p>

          {/* ID Type toggle */}
          <div className="flex gap-2 mb-5">
            {['bvn', 'nin'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setIdType(type); setIdNumber(''); setIdError('') }}
                className={[
                  'px-5 py-2 rounded-full text-sm font-medium transition-colors border',
                  idType === type
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-content-secondary border-surface-border hover:border-brand-300',
                ].join(' ')}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="form-label">
              {idType === 'bvn' ? 'Bank Verification Number (BVN)' : 'National Identification Number (NIN)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={idNumber}
              onChange={handleIdNumberChange}
              placeholder={`Enter your 11-digit ${idType.toUpperCase()}`}
              maxLength={11}
              className={`input-field ${idError ? 'input-error' : ''}`}
            />
            {idError && <p className="form-error">{idError}</p>}
            <p className="text-xs text-content-tertiary mt-1.5">
              Your {idType.toUpperCase()} is encrypted and never shared with third parties.
            </p>
          </div>
        </div>

        {/* Section 2: Selfie */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-content-primary mb-1">Selfie Photo</h2>
          <p className="text-xs text-content-tertiary mb-5">
            Take a clear photo of your face. Make sure your face is fully visible and well-lit.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {selfie ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={selfie.preview}
                  alt="Selfie preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-200"
                />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-content-primary">{selfie.file.name}</p>
                <p className="text-xs text-content-tertiary">{(selfie.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelfie(null); fileInputRef.current.value = '' }}
                className="text-xs text-status-error hover:text-red-700 transition-colors"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={[
                'w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-3 transition-colors',
                selfieError
                  ? 'border-status-error bg-red-50'
                  : 'border-surface-border hover:border-brand-400 hover:bg-brand-50',
              ].join(' ')}
            >
              <div className="w-12 h-12 bg-surface-tertiary rounded-full flex items-center justify-center">
                <Camera size={22} className="text-content-tertiary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-content-primary">Click to upload selfie</p>
                <p className="text-xs text-content-tertiary mt-0.5">PNG, JPG up to 5MB</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-600">
                <Upload size={12} />
                <span>Choose file</span>
              </div>
            </button>
          )}
          {selfieError && <p className="form-error mt-2">{selfieError}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Submitting…
            </span>
          ) : 'Submit for Verification'}
        </button>
      </form>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="page-title">Identity Verification</h1>
      <p className="text-sm text-content-secondary mt-1">
        Verify your identity to unlock full buying and selling privileges on PayClutr.
      </p>
    </div>
  )
}
