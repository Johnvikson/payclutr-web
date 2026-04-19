import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthHeroPanel from '../../components/layout/AuthHeroPanel.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { register as apiRegister } from '../../api/endpoints.js'

function validate(f) {
  const e = {}
  if (!f.firstName || f.firstName.trim().length < 2) e.firstName = 'At least 2 characters'
  if (!f.lastName  || f.lastName.trim().length  < 2) e.lastName  = 'At least 2 characters'
  if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email'
  if (!f.phone || !/^0\d{10}$/.test(f.phone)) e.phone = '11 digits starting with 0'
  if (!f.password || f.password.length < 8) e.password = 'At least 8 characters'
  if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match'
  return e
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login: storeAuth } = useAuth()
  const { showToast } = useToast()

  const [fields, setFields] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors]       = useState({})
  const [showPw, setShowPw]       = useState(false)
  const [showCPw, setShowCPw]     = useState(false)
  const [loading, setLoading]     = useState(false)

  const set = (key) => (e) => setFields((p) => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const { user, token, refresh } = await apiRegister({
        first_name: fields.firstName, last_name: fields.lastName,
        email: fields.email, phone: fields.phone,
        password: fields.password, password2: fields.confirmPassword,
      })
      storeAuth(user, token, refresh)
      navigate('/verify-otp')
    } catch {
      showToast('Registration failed. Please try again.', 'error')
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-base font-bold text-gray-900">PayClutr</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Create account</h1>
          <p className="text-sm text-gray-400 mb-8">Join PayClutr and start buying & selling safely</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">First Name</label>
                <input type="text" value={fields.firstName} onChange={set('firstName')} placeholder="Victor"
                  className={`input-field ${errors.firstName ? 'input-error' : ''}`} />
                {errors.firstName && <p className="form-error">{errors.firstName}</p>}
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input type="text" value={fields.lastName} onChange={set('lastName')} placeholder="Johnson"
                  className={`input-field ${errors.lastName ? 'input-error' : ''}`} />
                {errors.lastName && <p className="form-error">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input type="email" value={fields.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email"
                className={`input-field ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input type="tel" value={fields.phone} onChange={set('phone')} placeholder="08012345678" maxLength={11}
                className={`input-field ${errors.phone ? 'input-error' : ''}`} />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={fields.password} onChange={set('password')}
                  placeholder="At least 8 characters" autoComplete="new-password"
                  className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <input type={showCPw ? 'text' : 'password'} value={fields.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="Re-enter your password" autoComplete="new-password"
                  className={`input-field pr-10 ${errors.confirmPassword ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowCPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
