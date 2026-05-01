import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Users } from 'lucide-react'
import AuthHeroPanel from '../../components/layout/AuthHeroPanel.jsx'
import Logo from '../../components/ui/Logo.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { login as apiLogin } from '../../api/endpoints.js'

function validate(fields) {
  const errors = {}
  if (!fields.identifier) errors.identifier = 'Email or phone number is required'
  if (!fields.password) errors.password = 'Password is required'
  return errors
}

function GoogleButton({ label }) {
  return (
    <button
      type="button"
      disabled
      title="Google sign-in is not connected yet"
      className="w-full h-11 rounded-lg border border-gray-200 bg-white text-gray-400 flex items-center justify-center gap-3 text-sm font-medium cursor-not-allowed"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
      </svg>
      {label}
    </button>
  )
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] uppercase tracking-wider text-gray-400">or</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: storeAuth } = useAuth()
  const [fields, setFields] = useState({ identifier: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key) => (event) => setFields((prev) => ({ ...prev, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(fields)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const { user, token, refresh } = await apiLogin({ email: fields.identifier, password: fields.password })
      storeAuth(user, token, refresh)
      navigate(user.email_verified ? '/browse' : '/verify-otp')
    } catch {
      setErrors({ password: 'Incorrect email/phone or password.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 lg:w-2/5 lg:flex-none flex items-center justify-center p-6 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="hidden lg:block mb-10">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your PayClutr account</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            <GoogleButton label="Sign in with Google" />
            <OrDivider />

            <div>
              <label className="form-label">Email</label>
              <input
                type="text"
                value={fields.identifier}
                onChange={set('identifier')}
                placeholder="you@email.com"
                autoComplete="email"
                className={`input-field ${errors.identifier ? 'input-error' : ''}`}
              />
              {errors.identifier && <p className="form-error">{errors.identifier}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={fields.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold">
                Register
              </Link>
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Users size={12} />
            Trusted by Nigerian buyers and sellers
          </div>
        </div>
      </div>

      <AuthHeroPanel />
    </div>
  )
}
