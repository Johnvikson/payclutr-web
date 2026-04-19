import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useToast } from '../../components/ui/Toast.jsx'
import { sendEmailOtp, verifyEmailOtp } from '../../api/endpoints.js'

const OTP_LENGTH = 6
const TIMER_SECONDS = 120

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [hasError, setHasError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  // Send OTP on mount
  useEffect(() => {
    sendEmailOtp().catch((err) => {
      // Interceptor already extracts response.data, so err is {detail:'...'} or raw AxiosError
      const msg = err?.detail || err?.message || 'Could not reach server. Check your connection.'
      showToast(msg, 'error')
    })
  }, [showToast])

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) { setCanResend(true); return }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const submit = useCallback(async (otpDigits) => {
    const otp = otpDigits.join('')
    if (otp.length < OTP_LENGTH) return
    setLoading(true)
    setHasError(false)
    try {
      await verifyEmailOtp({ otp })
      showToast('Email verified!', 'success')
      navigate('/browse')
    } catch {
      setHasError(true)
      // shake and clear after brief delay
      setTimeout(() => {
        setDigits(Array(OTP_LENGTH).fill(''))
        setHasError(false)
        inputRefs.current[0]?.focus()
      }, 700)
    } finally {
      setLoading(false)
    }
  }, [navigate, showToast])

  function handleChange(index, value) {
    // Allow only single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== '')) {
      submit(next)
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ''
        setDigits(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const next = [...digits]
        next[index - 1] = ''
        setDigits(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
    if (next.every((d) => d !== '')) {
      submit(next)
    }
  }

  async function handleResend() {
    setSecondsLeft(TIMER_SECONDS)
    setCanResend(false)
    try {
      await sendEmailOtp()
      showToast('A new code has been sent to your email.', 'info')
    } catch {
      showToast('Failed to resend code. Please try again.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border border-gray-100 rounded-2xl p-8 text-center shadow-xs bg-white">
        {/* Icon */}
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={28} className="text-brand-600" />
        </div>

        <h1 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
          Enter verification code
        </h1>
        <p className="text-sm text-content-secondary mb-8">
          We sent a 6-digit code to your email address. Enter it below.
        </p>

        {/* OTP boxes */}
        <div
          className={`flex gap-2.5 justify-center mb-5 ${hasError ? 'animate-shake' : ''}`}
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={[
                'w-11 h-12 text-center text-lg font-semibold rounded-lg border-2 outline-none transition-all duration-150',
                'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                'disabled:opacity-50',
                hasError
                  ? 'border-status-error bg-red-50 text-status-error'
                  : digit
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-border bg-white text-content-primary',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Timer / Resend */}
        <div className="mb-6 h-5">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-content-tertiary">
              Resend in <span className="font-medium text-content-secondary">{formatTime(secondsLeft)}</span>
            </p>
          )}
        </div>

        {hasError && (
          <p className="text-sm text-status-error mb-4">Incorrect code. Please try again.</p>
        )}

        <button
          onClick={() => submit(digits)}
          disabled={loading || digits.some((d) => !d)}
          className="btn-primary w-full py-3 text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Verifying…
            </span>
          ) : 'Verify Code'}
        </button>

        <Link
          to="/login"
          className="block mt-4 text-sm text-content-secondary hover:text-content-primary transition-colors"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
