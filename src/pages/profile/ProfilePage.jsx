import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Pencil, X, BadgeCheck, MapPin, Calendar, Mail, Phone, ShieldCheck, CreditCard,
  Package, MessageSquare, Inbox,
} from 'lucide-react'
import { getUserProfile, updateMe, getListings } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import ListingCard from '../../components/listings/ListingCard.jsx'
import { formatDate } from '../../utils/formatters.js'

import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Stars from '../../components/ui/Stars.jsx'
import { Field, TextInput } from '../../components/ui/Field.jsx'

const TABS = [
  { key: 'listings', label: 'Listings' },
  { key: 'reviews',  label: 'Reviews'  },
  { key: 'about',    label: 'About'    },
]

// ─── Edit Profile modal (slimmed-down, themed) ──────────────────────────────
function EditProfileModal({ profile, onClose }) {
  const qc = useQueryClient()
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
      qc.invalidateQueries({ queryKey: ['profile', String(profile.id)] })
      showToast('Profile updated', 'success')
      onClose()
    },
    onError: (err) => {
      showToast(err?.detail ?? 'Failed to update profile.', 'error')
    },
  })

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Edit profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <TextInput name="first_name" value={form.first_name} onChange={handleChange} required />
            </Field>
            <Field label="Last name">
              <TextInput name="last_name" value={form.last_name} onChange={handleChange} required />
            </Field>
          </div>
          <Field label="State">
            <TextInput name="state" value={form.state} onChange={handleChange} placeholder="e.g. Lagos" />
          </Field>
          <Field label="City">
            <TextInput name="city" value={form.city} onChange={handleChange} placeholder="e.g. Lekki" />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" full onClick={onClose}>Cancel</Button>
            <Button type="submit" full disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Verification badge row (About tab) ─────────────────────────────────────
function VerificationBadge({ icon: Icon, label, verified }) {
  return verified ? (
    <Badge tone="verified">
      <Icon size={11} /> {label}
    </Badge>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ring-1 ring-inset ring-gray-200 dark:ring-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-zinc-500">
      <Icon size={11} /> {label}
    </span>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)]">
      <div className="h-32 bg-gradient-to-br from-zinc-200 via-zinc-100 to-orange-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-900" />
      <div className="px-4 lg:px-8 -mt-10 pb-6 max-w-6xl mx-auto animate-pulse">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-900" />
          <div className="pb-1 flex-1 space-y-2">
            <div className="h-5 w-40 bg-gray-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-56 bg-gray-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState('listings')

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

  const isOwn = user && profile && String(user.id) === String(profile.id)

  if (profileLoading) return <ProfileSkeleton />

  if (isError || !profile) {
    return (
      <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
          <Package size={26} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Profile not found</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-xs">
          This user profile doesn't exist or has been removed.
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
  const locationParts = [profile.city, profile.state].filter(Boolean)
  const memberSince = profile.created_at ? formatDate(profile.created_at) : null
  const ratingNumber = profile.trust_score != null ? Number(profile.trust_score).toFixed(1) : null

  const showVerifiedTick =
    profile.kyc_verified || profile.email_verified || profile.is_trusted_seller

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)]">
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-zinc-200 via-zinc-100 to-orange-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-900" />

      <div className="px-4 lg:px-8 -mt-10 pb-6 max-w-6xl mx-auto">

        {/* Header row: avatar + name/meta + edit button */}
        <div className="flex items-end gap-4 flex-wrap">
          <UserAvatar user={profile} size="2xl" className="ring-4 ring-white dark:ring-zinc-900" />
          <div className="pb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 truncate">{fullName}</h1>
              {showVerifiedTick && (
                <BadgeCheck size={18} className="text-blue-500 shrink-0" title="Verified" />
              )}
              {profile.is_trusted_seller && (
                <Badge tone="brand" size="xs" dot={false}>Trusted seller</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-500 flex-wrap">
              {memberSince && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} /> Member since {memberSince}
                </span>
              )}
              {ratingNumber && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Stars value={profile.trust_score} size={11} />
                    <span className="font-medium text-gray-700 dark:text-zinc-300">{ratingNumber}</span>
                  </span>
                </>
              )}
              <span>·</span>
              <span>{profile.total_sales || 0} sales</span>
            </div>
          </div>
          {isOwn && (
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit profile
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-5 border-b border-gray-200 dark:border-zinc-800 flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {tab === 'listings' && (
          <div className="mt-5">
            {listingsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <EmptyTab
                icon={Package}
                title="No active listings"
                body={isOwn
                  ? 'Items you list will appear here once approved.'
                  : `${profile.first_name} hasn't listed anything yet.`}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            )}
          </div>
        )}

        {/* Reviews tab — placeholder until ratings API is wired */}
        {tab === 'reviews' && (
          <div className="mt-5">
            <EmptyTab
              icon={MessageSquare}
              title="No reviews yet"
              body={isOwn
                ? 'Reviews from buyers will appear here after completed orders.'
                : 'This seller has no reviews yet.'}
            />
          </div>
        )}

        {/* About tab */}
        {tab === 'about' && (
          <div className="mt-5 space-y-3">
            <Card>
              <SectionLabel>Location</SectionLabel>
              <p className="mt-1.5 text-sm text-gray-700 dark:text-zinc-300 inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400" />
                {locationParts.length > 0 ? locationParts.join(', ') : 'Not provided'}
              </p>
            </Card>

            <Card>
              <SectionLabel>Verified</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                <VerificationBadge icon={Mail}        label="Email"      verified={!!profile.email_verified} />
                <VerificationBadge icon={ShieldCheck} label="NIN + Selfie" verified={!!profile.kyc_verified} />
                <VerificationBadge icon={CreditCard}  label="BVN"        verified={!!profile.bvn_verified} />
              </div>
              <p className="mt-3 text-[11px] text-gray-500 dark:text-zinc-500">
                Verifications confirm the seller passed PayClutr's identity checks.
              </p>
            </Card>
          </div>
        )}
      </div>

      {editOpen && (
        <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} />
      )}
    </div>
  )
}

// ─── Tiny helpers ───────────────────────────────────────────────────────────
function Card({ children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold">
      {children}
    </div>
  )
}

function EmptyTab({ icon: Icon, title, body }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
      <div className="flex flex-col items-center justify-center text-center py-14 px-6">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 mb-3">
          <Icon size={22} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-xs">{body}</p>
      </div>
    </div>
  )
}
