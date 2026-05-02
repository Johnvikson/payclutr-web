import { useRef, useState } from 'react'
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  FileImage,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { submitKyc } from '../../api/endpoints.js'
import { uploadImage } from '../../lib/supabase.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const DOCUMENT_TYPES = [
  { value: 'nin', label: 'NIN' },
  { value: 'voters_card', label: "Voter's card" },
  { value: 'drivers_license', label: "Driver's license" },
  { value: 'passport', label: 'Passport' },
]

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
    body: 'Your documents are being reviewed. Check back in 24 hours.',
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
        Upload a valid government ID and selfie for manual review.
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
      {[1, 2, 3].map((number) => (
        <div key={number} className="contents">
          <div className="flex items-center gap-2">
            <div
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                number <= step ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400',
              ].join(' ')}
            >
              {number < step ? <Check size={12} strokeWidth={3} /> : number}
            </div>
            <div
              className={[
                'hidden sm:block text-sm font-medium',
                number <= step ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400',
              ].join(' ')}
            >
              Step {number}
            </div>
          </div>
          {number < 3 && (
            <div className={`flex-1 h-px ${step > number ? 'bg-brand' : 'bg-gray-200 dark:bg-zinc-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function readPreview(file, onLoad) {
  const reader = new FileReader()
  reader.onload = (event) => onLoad({ file, preview: event.target.result })
  reader.readAsDataURL(file)
}

function UploadBox({ title, hint, value, error, inputRef, onFile, onClear, round = false }) {
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />

      {value ? (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/40 p-4">
          <div className="flex items-center gap-3">
            <img
              src={value.preview}
              alt={`${title} preview`}
              className={[
                'shrink-0 object-cover border border-gray-200 dark:border-zinc-700',
                round ? 'w-16 h-16 rounded-full' : 'w-20 h-14 rounded-lg',
              ].join(' ')}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{value.file.name}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                {(value.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="mt-3 text-xs text-red-600 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={[
            'w-full min-h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 transition-colors',
            error
              ? 'border-red-300 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-zinc-700 hover:border-brand hover:bg-orange-50/30 dark:hover:bg-orange-950/10',
          ].join(' ')}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">
            {round ? <Camera size={22} /> : <FileImage size={22} />}
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">{title}</div>
          <div className="text-xs text-gray-400 text-center">{hint}</div>
          <div className="flex items-center gap-1.5 text-xs text-brand">
            <Upload size={12} />
            Choose file
          </div>
        </button>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}

export default function KycPage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const frontInputRef = useRef(null)
  const backInputRef = useRef(null)
  const selfieInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [documentType, setDocumentType] = useState('nin_slip')
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [selfie, setSelfie] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(user?.kyc_status === 'pending')

  const kycStatus = submitted ? 'pending' : user?.kyc_status
  const canSubmit = !!documentType && !!frontImage && !!backImage && !!selfie && !loading

  function handleImage(field, setter) {
    return (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setErrors((current) => ({ ...current, [field]: 'Please upload an image file.' }))
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors((current) => ({ ...current, [field]: 'Image must be less than 5MB.' }))
        return
      }
      readPreview(file, setter)
      setErrors((current) => ({ ...current, [field]: '' }))
    }
  }

  function clearImage(field, setter, inputRef) {
    setter(null)
    if (inputRef.current) inputRef.current.value = ''
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function validateDocuments() {
    const nextErrors = {}
    if (!documentType) nextErrors.documentType = 'Choose the type of ID you are uploading.'
    if (!frontImage) nextErrors.front = 'Upload the front of your ID.'
    if (!backImage) nextErrors.back = 'Upload the back of your ID.'
    setErrors((current) => ({ ...current, ...nextErrors }))
    return Object.keys(nextErrors).length === 0
  }

  function validateSelfie() {
    if (selfie) return true
    setErrors((current) => ({ ...current, selfie: 'Upload a clear selfie photo.' }))
    return false
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const hasDocuments = validateDocuments()
    const hasSelfie = validateSelfie()
    if (!hasDocuments) {
      setStep(1)
      return
    }
    if (!hasSelfie) {
      setStep(2)
      return
    }

    setLoading(true)
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadImage(frontImage.file, 'kyc'),
        uploadImage(backImage.file, 'kyc'),
        uploadImage(selfie.file, 'kyc'),
      ])
      await submitKyc({
        id_document_type: documentType,
        id_front_url: frontUrl,
        id_back_url: backUrl,
        selfie_url: selfieUrl,
      })
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
              Our team is reviewing your ID and selfie. This usually takes less than 24 hours.
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader />

        <div className="mt-5 space-y-3">
          <StatusBanner status={kycStatus === 'rejected' ? 'rejected' : null} />
        </div>

        <StepProgress step={step} />

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
            {step === 1 && (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Upload government ID</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  Use a clear photo of the front and back of your NIN, voter's card, driver's license, or passport.
                </p>

                <div className="mt-4">
                  <label htmlFor="documentType" className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    ID type
                  </label>
                  <select
                    id="documentType"
                    value={documentType}
                    onChange={(event) => {
                      setDocumentType(event.target.value)
                      setErrors((current) => ({ ...current, documentType: '' }))
                    }}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.documentType && <p className="text-xs text-red-600 mt-1">{errors.documentType}</p>}
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <UploadBox
                    title="Front of ID"
                    hint="JPG or PNG, up to 5MB"
                    value={frontImage}
                    error={errors.front}
                    inputRef={frontInputRef}
                    onFile={handleImage('front', setFrontImage)}
                    onClear={() => clearImage('front', setFrontImage, frontInputRef)}
                  />
                  <UploadBox
                    title="Back of ID"
                    hint="JPG or PNG, up to 5MB"
                    value={backImage}
                    error={errors.back}
                    inputRef={backInputRef}
                    onFile={handleImage('back', setBackImage)}
                    onClear={() => clearImage('back', setBackImage, backInputRef)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (validateDocuments()) setStep(2)
                  }}
                  className="mt-4 w-full h-10 inline-flex items-center justify-center rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Upload selfie</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  Upload a clear selfie so admin can compare your face with the ID document.
                </p>

                <div className="mt-4">
                  <UploadBox
                    title="Take or upload selfie"
                    hint="Face clearly visible, JPG or PNG up to 5MB"
                    value={selfie}
                    error={errors.selfie}
                    inputRef={selfieInputRef}
                    onFile={handleImage('selfie', setSelfie)}
                    onClear={() => clearImage('selfie', setSelfie, selfieInputRef)}
                    round
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateSelfie()) setStep(3)
                    }}
                    className="h-10 flex-1 inline-flex items-center justify-center rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Review submission</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  Make sure the ID photos are clear before sending them for admin review.
                </p>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3">
                    <div className="text-xs text-gray-500 dark:text-zinc-500">ID type</div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {DOCUMENT_TYPES.find((type) => type.value === documentType)?.label}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[frontImage, backImage, selfie].map((image, index) => (
                      <div key={image?.file?.name || index} className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3">
                        <img
                          src={image?.preview}
                          alt={['ID front', 'ID back', 'Selfie'][index]}
                          className="w-full aspect-[4/3] object-cover rounded-lg bg-gray-100"
                        />
                        <div className="mt-2 text-xs font-medium text-gray-600 dark:text-zinc-400">
                          {['Front of ID', 'Back of ID', 'Selfie'][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
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
