import { Link } from 'react-router-dom'

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-8xl font-bold text-status-error">500</p>
      <h1 className="mt-4 text-2xl font-bold text-content-primary">Something went wrong</h1>
      <p className="mt-2 text-content-secondary">An unexpected error occurred. Please try again later.</p>
      <Link to="/browse" className="mt-6 px-6 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
        Go to Browse
      </Link>
    </div>
  )
}
