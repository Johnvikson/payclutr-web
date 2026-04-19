import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useToast } from '../../components/ui/Toast.jsx'
import { resetPassword } from '../../api/endpoints.js'

function getStrength(pw) {
  if (!pw) return null
  const score = [pw.length >= 8, /[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length
  if (score <= 2) return { label: 'Weak',   color: 'bg-status-error',   width: 'w-1/3', textColor: 'text-status-error' }
  if (score <= 3) return { label: 'Medium', color: 'bg-status-warning', width: 'w-2/3', textColor: 'text-status-warning' }
  return              { label: 'Strong', color: 'bg-status-success', width: 'w-full', textColor: 'text-status-success' }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()

  const [fields, setFields] = useState({
    email:           searchParams.get('email') || '',
    otp:             '',
    password:        '',
    confirmPassword: '',
  })
  const [errors, setErrors]   = useState({})
  const [showPw, setShowPw]   = useState(false)
  const [showCon, setShowCon] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = getStrength(fields.password)

  function set(key) {
    return (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!fields.email) errs.email = 'Email is required'
    if (!fields.otp || fields.otp.length !== 6) errs.otp = 'Enter the 6-digit code from your email'
    if (!fields.password || fields.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (fields.confirmPassword !== fields.password) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      await resetPassword({ email: fields.email, otp: fields.otp, password: fields.password })
      showToast('Password reset successfully!', 'success')
      navigate('/login')
    } catch (err) {
      const msg = err?.detail || 'Failed to reset password. Check your code and try again.'
      setErrors({ otp: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border border-gray-100 rounded-2xl p-8 shadow-xs bg-white">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-brand-600" />
        </div>

        <h1 className="text-2xl font-bold text-content-primary tracking-tight text-center mb-2">
          Create new password
        </h1>
        <p className="text-sm text-content-secondary text-center mb-8">
          Enter the 6-digit code sent to your email and choose a new password.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={fields.email}
              onChange={set('email')}
              placeholder="victor@example.com"
              className={`input-field ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* OTP */}
          <div>
            <label className="form-label">Reset Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={fields.otp}
              onChange={(e) => setFields((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              placeholder="6-digit code from email"
              className={`input-field tracking-widest text-center text-lg font-semibold ${errors.otp ? 'input-error' : ''}`}
            />
            {errors.otp && <p className="form-error">{errors.otp}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={fields.password}
                onChange={set('password')}
                placeholder="Create a strong password"
                className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-secondary transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
            {fields.password && strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <p className={`text-xs mt-1 font-medium ${strength.textColor}`}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <input
                type={showCon ? 'text' : 'password'}
                value={fields.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Re-enter your password"
                className={`input-field pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
              />
              <button type="button" onClick={() => setShowCon((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-secondary transition-colors">
                {showCon ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Saving…
              </span>
            ) : 'Save New Password'}
          </button>
        </form>

        <Link to="/login" className="block mt-4 text-sm text-center text-content-secondary hover:text-content-primary transition-colors">
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
