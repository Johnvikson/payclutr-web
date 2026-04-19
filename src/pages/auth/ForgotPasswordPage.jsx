import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, CheckCircle } from 'lucide-react'
import { forgotPassword } from '../../api/endpoints.js'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      await forgotPassword({ email })
      setSuccess(true)
    } catch (err) {
      setError(err?.detail || err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border border-gray-100 rounded-2xl p-8 text-center shadow-xs bg-white">
        {success ? (
          <>
            <div className="w-16 h-16 bg-status-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={28} className="text-status-success" />
            </div>
            <h1 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
              Check your email
            </h1>
            <p className="text-sm text-content-secondary leading-relaxed mb-8">
              We sent a 6-digit reset code to <strong>{email}</strong>. Enter it on the next page to set a new password.
            </p>
            <button
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="btn-primary w-full py-2.5 block text-center mb-3"
            >
              Enter Reset Code
            </button>
            <Link to="/login" className="block text-sm text-content-secondary hover:text-content-primary transition-colors">
              ← Back to Login
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyRound size={28} className="text-brand-600" />
            </div>

            <h1 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
              Forgot your password?
            </h1>
            <p className="text-sm text-content-secondary leading-relaxed mb-8">
              Enter your email address and we'll send you a 6-digit code to reset your password.
            </p>

            <form onSubmit={handleSubmit} noValidate className="text-left space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="victor@example.com"
                  className={`input-field ${error ? 'input-error' : ''}`}
                />
                {error && <p className="form-error">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Sending…
                  </span>
                ) : 'Send Reset Code'}
              </button>
            </form>

            <Link
              to="/login"
              className="block mt-4 text-sm text-content-secondary hover:text-content-primary transition-colors"
            >
              ← Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
