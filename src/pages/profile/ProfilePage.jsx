import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldCheck, Star, MapPin, Calendar, Package, Edit2, X } from 'lucide-react'
import { getUserProfile, updateMe, getListings } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import ListingCard from '../../components/listings/ListingCard.jsx'
import { formatDate } from '../../utils/formatters.js'

function EditProfileModal({ profile, onClose, onSaved }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name:  profile?.last_name  || '',
    state:      profile?.state      || '',
    city:       profile?.city       || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', String(profile.id)] })
      showToast('Profile updated!', 'success')
      onSaved()
    },
    onError: () => showToast('Failed to update profile. Please try again.', 'error'),
  })

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} className="input-field" placeholder="First name" required />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} className="input-field" placeholder="Last name" required />
            </div>
          </div>
          <div>
            <label className="form-label">State</label>
            <input name="state" value={form.state} onChange={handleChange} className="input-field" placeholder="e.g. Lagos" />
          </div>
          <div>
            <label className="form-label">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="e.g. Ikeja" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 h-14" />
      <div className="bg-white border-b border-gray-100 px-4 py-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="space-y-2 text-center">
            <Skeleton className="w-40 h-5 mx-auto" />
            <Skeleton className="w-24 h-3.5 mx-auto" />
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getUserProfile(id),
    retry: 1,
  })

  const { data: listingsResult, isLoading: listingsLoading } = useQuery({
    queryKey: ['listings', { seller: id }],
    queryFn: () => getListings({ seller: id }),
    enabled: !!profile,
  })
  const listings = listingsResult?.data ?? listingsResult ?? []

  const isOwnProfile = user && profile && String(user.id) === String(profile.id)

  if (profileLoading) return <ProfileSkeleton />

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
          <Package size={26} className="text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Profile not found</h1>
        <p className="text-sm text-gray-500 max-w-xs">This user profile doesn't exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
      </div>
    )
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim()
  const locationParts = [profile.city, profile.state].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <p className="flex-1 text-sm font-semibold text-gray-900 truncate">{fullName}</p>
          {isOwnProfile && (
            <button onClick={() => setEditOpen(true)} className="btn-secondary gap-1.5 py-1.5 px-3 text-xs">
              <Edit2 size={12} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
          <UserAvatar user={profile} size="2xl" />

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{fullName}</h1>
              {profile.email_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <ShieldCheck size={11} />
                  Verified
                </span>
              )}
              {profile.is_trusted_seller && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Star size={11} className="fill-amber-500" />
                  Trusted Seller
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-gray-400">
              {locationParts.length > 0 && (
                <span className="flex items-center gap-1"><MapPin size={11} />{locationParts.join(', ')}</span>
              )}
              {profile.created_at && (
                <span className="flex items-center gap-1"><Calendar size={11} />Member since {formatDate(profile.created_at)}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-stretch divide-x divide-gray-100 border border-gray-100 rounded-xl overflow-hidden w-full max-w-sm">
            {[
              { value: profile.total_sales ?? 0, label: 'Sales' },
              { value: profile.trust_score != null ? `${Math.round(profile.trust_score)}/100` : '—', label: 'Trust Score' },
              { value: profile.listing_count ?? listings.length ?? 0, label: 'Listings' },
            ].map(({ value, label }) => (
              <div key={label} className="flex-1 flex flex-col items-center py-3 px-2">
                <span className="text-lg font-bold text-gray-900">{value}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Listings</h2>
        {listingsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Package size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No active listings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
