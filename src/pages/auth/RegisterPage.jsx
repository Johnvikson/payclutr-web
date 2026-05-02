import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthHeroPanel from '../../components/layout/AuthHeroPanel.jsx'
import Logo from '../../components/ui/Logo.jsx'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { googleAuth, register as apiRegister } from '../../api/endpoints.js'

function validate(fields) {
  const errors = {}
  if (!fields.firstName || fields.firstName.trim().length < 2) errors.firstName = 'At least 2 characters'
  if (!fields.lastName || fields.lastName.trim().length < 2) errors.lastName = 'At least 2 characters'
  if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Enter a valid email'
  if (!fields.phone || !/^0\d{10}$/.test(fields.phone)) errors.phone = '11 digits starting with 0'
  if (!fields.password || fields.password.length < 8) errors.password = 'At least 8 characters'
  if (fields.confirmPassword !== fields.password) errors.confirmPassword = 'Passwords do not match'
  return errors
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

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login: storeAuth } = useAuth()
  const { showToast } = useToast()

  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'buyer',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const set = (key) => (event) => setFields((prev) => ({ ...prev, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(fields)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const { user, token, refresh } = await apiRegister({
        first_name: fields.firstName,
        last_name: fields.lastName,
        email: fields.email,
        phone: fields.phone,
        role: fields.role,
        password: fields.password,
        password2: fields.confirmPassword,
      })
      storeAuth(user, token, refresh)
      navigate('/verify-otp')
    } catch {
      showToast('Registration failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleCredential(credential) {
    if (!credential) return
    setGoogleLoading(true)
    try {
      const { user, token, refresh } = await googleAuth({ credential, role: fields.role })
      storeAuth(user, token, refresh)
      navigate(user.email_verified ? '/browse' : '/verify-otp')
    } catch {
      showToast('Google sign-up failed. Please try again.', 'error')
    } finally {
      setGoogleLoading(false)
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

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start buying and selling on PayClutr</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-3">
            <GoogleAuthButton text="signup_with" onCredential={handleGoogleCredential} disabled={googleLoading} />
            <OrDivider />

            <div>
              <label className="form-label">Account type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['buyer', 'Buyer'],
                  ['seller', 'Seller'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFields((prev) => ({ ...prev, role: value }))}
                    className={[
                      'h-10 rounded-lg border text-sm font-medium transition-colors',
                      fields.role === value
                        ? 'border-brand-500 bg-orange-50 text-brand'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">First name</label>
                <input
                  type="text"
                  value={fields.firstName}
                  onChange={set('firstName')}
                  placeholder="Emeka"
                  className={`input-field ${errors.firstName ? 'input-error' : ''}`}
                />
                {errors.firstName && <p className="form-error">{errors.firstName}</p>}
              </div>
              <div>
                <label className="form-label">Last name</label>
                <input
                  type="text"
                  value={fields.lastName}
                  onChange={set('lastName')}
                  placeholder="Obi"
                  className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                />
                {errors.lastName && <p className="form-error">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={fields.email}
                onChange={set('email')}
                placeholder="you@email.com"
                autoComplete="email"
                className={`input-field ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label className="form-label">Phone number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pr-3 border-r border-gray-200 pointer-events-none">
                  +234
                </span>
                <input
                  type="tel"
                  value={fields.phone}
                  onChange={set('phone')}
                  placeholder="08012345678"
                  maxLength={11}
                  className={`input-field pl-[4.6rem] ${errors.phone ? 'input-error' : ''}`}
                />
              </div>
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={fields.password}
                  onChange={set('password')}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
              {!errors.password && <p className="text-xs text-gray-500 mt-1">Minimum 8 characters.</p>}
            </div>

            <div>
              <label className="form-label">Confirm password</label>
              <div className="relative">
                <input
                  type={showCPw ? 'text' : 'password'}
                  value={fields.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCPw((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-xs text-gray-500 text-center leading-relaxed mt-3">
              By creating an account you agree to PayClutr&apos;s Terms and Privacy Policy.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthHeroPanel />
    </div>
  )
}
