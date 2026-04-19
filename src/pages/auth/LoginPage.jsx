import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthHeroPanel from '../../components/layout/AuthHeroPanel.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { login as apiLogin } from '../../api/endpoints.js'

function validate(f) {
  const e = {}
  if (!f.identifier) e.identifier = 'Email or phone number is required'
  if (!f.password) e.password = 'Password is required'
  return e
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: storeAuth } = useAuth()
  const [fields, setFields]   = useState({ identifier: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setFields((p) => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return
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
    <div className="flex min-h-screen">
      <AuthHeroPanel />

      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto py-12 px-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-base font-bold text-gray-900">PayClutr</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="form-label">Email or Phone</label>
              <input
                type="text"
                value={fields.identifier}
                onChange={set('identifier')}
                placeholder="you@example.com or 08012345678"
                autoComplete="email"
                className={`input-field ${errors.identifier ? 'input-error' : ''}`}
              />
              {errors.identifier && <p className="form-error">{errors.identifier}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={fields.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            No account?{' '}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
