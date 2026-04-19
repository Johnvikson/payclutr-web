import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border border-gray-100 rounded-2xl p-8 text-center shadow-xs bg-white">
        {/* Icon */}
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-brand-600" />
        </div>

        <h1 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
          Check your email
        </h1>
        <p className="text-sm text-content-secondary leading-relaxed mb-8">
          We sent a verification link to your email address. Click the link to verify your account and get started.
        </p>

        <button className="btn-secondary w-full py-2.5">
          Resend Email
        </button>

        <Link
          to="/login"
          className="block mt-4 text-sm text-content-secondary hover:text-content-primary transition-colors"
        >
          ← Back to Login
        </Link>

        <p className="mt-8 text-xs text-content-tertiary">
          Didn't receive the email? Check your spam folder or try a different email address.
        </p>
      </div>
    </div>
  )
}
