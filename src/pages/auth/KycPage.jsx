import { useState, useRef } from 'react'
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { submitKyc } from '../../api/endpoints.js'
import { uploadImage } from '../../lib/supabase.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const STATUS_CONFIG = {
  verified: {
    Icon: ShieldCheck,
    title: 'Verified',
    body: 'Your account is fully verified. You can buy, sell, and withdraw without KYC limits.',
    className: 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200',
    iconClassName: 'text-emerald-600',
    bodyClassName: 'text-emerald-700 dark:text-emerald-300',
  },
  pending: {
    Icon: Clock,
    title: 'Under review',
    body: 'Your details are being reviewed. Check back in 24 hours.',
    className: 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200',
    iconClassName: 'text-amber-600',
    bodyClassName: 'text-amber-700 dark:text-amber-300',
  },
  rejected: {
    Icon: AlertCircle,
    title: 'Verification rejected',
    body: 'Your previous submission was rejected. Please resubmit with clear, valid documents.',
    className: 'border-red-200 bg-red-50/70 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200',
    iconClassName: 'text-red-600',
    bodyClassName: 'text-red-700 dark:text-red-300',
  },
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Identity verification</h1>
      <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
        Verify your identity to sell on PayClutr and unlock higher transaction limits.
      </p>
    </div>
  )
}

function StatusBanner({ status }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  const StatusIcon = config.Icon

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${config.className}`}>
      <StatusIcon size={20} className={`${config.iconClassName} mt-0.5 shrink-0`} />
      <div>
        <div className="text-sm font-semibold">{config.title}</div>
        <div className={`text-xs mt-0.5 ${config.bodyClassName}`}>{config.body}</div>
      </div>
    </div>
  )
}

function StepProgress({ step }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      {[1, 2].map((number) => (
        <div key={number} className="contents">
          <div className="flex items-center gap-2">
            <div
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                number <= step
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-400',
              ].join(' ')}
            >
              {number < step ? <Check size={12} strokeWidth={3} /> : number}
            </div>
            <div
              className={[
                'text-sm font-medium',
                number <= step ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400',
              ].join(' ')}
            >
              Step {number} of 2
            </div>
          </div>
          {number < 2 && (
            <div className={`flex-1 h-px ${step > 1 ? 'bg-brand' : 'bg-gray-200 dark:bg-zinc-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function KycPage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [idNumber, setIdNumber] = useState('')
  const [idError, setIdError] = useState('')
  const [selfie, setSelfie] = useState(null)
  const [selfieError, setSelfieError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(user?.kyc_status === 'pending')

  const kycStatus = submitted ? 'pending' : user?.kyc_status
  const canSubmit = idNumber.length === 11 && !!selfie && !loading

  function handleIdNumberChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11)
    setIdNumber(val)
    setIdError('')
  }

  function validateNin() {
    if (idNumber.length !== 11) {
      setIdError('NIN must be exactly 11 digits')
      return false
    }
    return true
  }

  function goToSelfieStep() {
    if (!validateNin()) return
    setStep(2)
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

  function clearSelfie() {
    setSelfie(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const hasValidNin = validateNin()

    if (!selfie) {
      setSelfieError('Please upload a selfie photo')
      setStep(2)
    }
    if (!hasValidNin || !selfie) return

    setLoading(true)
    try {
      const selfieUrl = await uploadImage(selfie.file, 'kyc')
      await submitKyc({ nin: idNumber, selfie_url: selfieUrl })
      updateUser({ kyc_status: 'pending' })
      setSubmitted(true)
      showToast('KYC documents submitted successfully!', 'success')
    } catch (err) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Submission failed. Please try again.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (kycStatus === 'verified') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageHeader />
          <div className="mt-5">
            <StatusBanner status="verified" />
          </div>
          <div className="mt-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={30} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Identity verified</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Your identity has been verified successfully. You can now buy and sell on PayClutr.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus === 'pending') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageHeader />
          <div className="mt-5">
            <StatusBanner status="pending" />
          </div>
          <div className="mt-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Clock size={30} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Verification under review</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed">
              Our team is reviewing your documents. This usually takes less than 24 hours.
            </p>
            <div className="mt-6 py-3 px-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-xs text-gray-500 dark:text-zinc-500">
              You cannot resubmit while your documents are under review.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader />

        <div className="mt-5 space-y-3">
          <StatusBanner status={kycStatus === 'rejected' ? 'rejected' : null} />
        </div>

        <StepProgress step={step} />

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
            {step === 1 ? (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Enter your NIN</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  Your National Identification Number is used to verify your identity. Dial *346# to retrieve yours.
                </p>

                <div className="mt-4">
                  <label htmlFor="nin" className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    National Identification Number (NIN)
                  </label>
                  <input
                    id="nin"
                    type="text"
                    inputMode="numeric"
                    value={idNumber}
                    onChange={handleIdNumberChange}
                    placeholder="01234567890"
                    maxLength={11}
                    className={[
                      'w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand transition-colors',
                      idError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 dark:border-zinc-700 focus:border-brand',
                    ].join(' ')}
                  />
                  {idError && <p className="text-xs text-red-600 mt-1">{idError}</p>}
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1.5">11 digits, no spaces.</p>
                </div>

                <button
                  type="button"
                  onClick={goToSelfieStep}
                  className="mt-4 w-full h-10 inline-flex items-center justify-center rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Take a selfie</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  We'll match this against your NIN photo. Make sure your face is well-lit and clearly visible.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selfie ? (
                  <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/40 p-6">
                    <div className="relative">
                      <img
                        src={selfie.preview}
                        alt="Selfie preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-orange-100 dark:border-orange-900/30"
                      />
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                        <CheckCircle2 size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{selfie.file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        {(selfie.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelfie}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={[
                      'mt-4 w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                      selfieError
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-brand hover:bg-orange-50/30 dark:hover:bg-orange-950/10',
                    ].join(' ')}
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">
                      <Camera size={24} />
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">Take or upload selfie</div>
                    <div className="text-xs text-gray-400">JPG or PNG, up to 5MB</div>
                    <div className="flex items-center gap-1.5 text-xs text-brand">
                      <Upload size={12} />
                      Choose file
                    </div>
                  </button>
                )}
                {selfieError && <p className="text-xs text-red-600 mt-2">{selfieError}</p>}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="h-10 flex-1 inline-flex items-center justify-center rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit for review'}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
