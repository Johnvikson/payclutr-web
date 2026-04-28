import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Pencil, X, BadgeCheck, MapPin, Calendar, Mail, Phone, ShieldCheck, CreditCard,
  Package, MessageSquare, UploadCloud, Lock,
} from 'lucide-react'
import { getUserProfile, updateMe, getListings, sendPhoneOtp, verifyPhoneOtp, getMe } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import ListingCard from '../../components/listings/ListingCard.jsx'
import { uploadImage } from '../../lib/supabase.js'
import { formatDate } from '../../utils/formatters.js'

import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Stars from '../../components/ui/Stars.jsx'
import { Field, TextInput, TextArea } from '../../components/ui/Field.jsx'

const TABS = [
  { key: 'listings', label: 'Listings' },
  { key: 'reviews',  label: 'Reviews'  },
  { key: 'about',    label: 'About'    },
]

// ─── Edit Profile modal — matches Claude Design ─────────────────────────────
function EditProfileModal({ profile, onClose }) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  // Combine first/last for the design's single "Display name" field. Split on save.
  const initialDisplayName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()

  const [form, setForm] = useState({
    display_name: initialDisplayName,
    username:     profile?.username || '',
    bio:          profile?.bio   || '',
    location:     [profile?.city, profile?.state].filter(Boolean).join(', '),
    phone:        profile?.phone || '',
    avatar_url:   profile?.avatar_url || '',
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  // Phone verification flow state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState('')
  const [sendingPhoneOtp, setSendingPhoneOtp]  = useState(false)
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false)
  const [phoneVerifiedLocal, setPhoneVerifiedLocal] = useState(!!profile?.phone_verified)

  const mutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: (updated) => {
      // Sync auth context so Sidebar/Navbar/Wallet etc. pick up the new username, avatar, etc.
      if (updated && typeof updated === 'object') updateUser(updated)
      qc.invalidateQueries({ queryKey: ['profile', String(profile.id)] })
      showToast('Profile updated', 'success')
      onClose()
    },
    onError: (err) => {
      showToast(err?.detail ?? 'Failed to update profile.', 'error')
    },
  })

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  // ── Avatar upload handlers ───────────────────────────────────────────────
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be 2MB or less.', 'error')
      return
    }
    setUploadingAvatar(true)
    try {
      const url = await uploadImage(file)
      set('avatar_url', url)
    } catch (err) {
      showToast('Avatar upload failed. Please try again.', 'error')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleAvatarRemove() {
    set('avatar_url', '')
  }

  // ── Phone OTP handlers ───────────────────────────────────────────────────
  async function handleSendPhoneOtp() {
    if (!profile?.phone) {
      showToast('Save your phone number first, then verify it.', 'error')
      return
    }
    setSendingPhoneOtp(true)
    try {
      await sendPhoneOtp()
      setPhoneOtpSent(true)
      showToast('Verification code sent to your phone.', 'success')
    } catch (err) {
      showToast(err?.detail ?? 'Could not send OTP.', 'error')
    } finally {
      setSendingPhoneOtp(false)
    }
  }

  async function handleVerifyPhoneOtp() {
    if (phoneOtp.length !== 6) {
      showToast('Enter the 6-digit code.', 'error')
      return
    }
    setVerifyingPhoneOtp(true)
    try {
      await verifyPhoneOtp(phoneOtp)
      setPhoneVerifiedLocal(true)
      setPhoneOtpSent(false)
      setPhoneOtp('')
      showToast('Phone verified.', 'success')
      qc.invalidateQueries({ queryKey: ['profile', String(profile.id)] })
    } catch (err) {
      showToast(err?.detail ?? 'Invalid OTP. Please try again.', 'error')
    } finally {
      setVerifyingPhoneOtp(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault()

    // Validate username (3–20 letters/numbers/underscores)
    const username = form.username.trim().toLowerCase()
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameError('3–20 chars, letters, numbers, underscores')
      return
    }
    setUsernameError('')

    // Split "Display name" into first / last (first word vs the rest)
    const trimmed = form.display_name.trim()
    const parts = trimmed.split(/\s+/)
    const first_name = parts[0] || ''
    const last_name  = parts.slice(1).join(' ') || ''

    // Split "Lekki, Lagos" → city: Lekki, state: Lagos State
    const locationParts = form.location.split(',').map((s) => s.trim()).filter(Boolean)
    const city  = locationParts[0] || ''
    const state = locationParts.slice(1).join(', ') || ''

    mutation.mutate({
      username: username || null,
      first_name,
      last_name,
      bio: form.bio,
      city,
      state,
      phone: form.phone || null,
      avatar_url: form.avatar_url || null,
    })
  }

  // Build a synthetic user for the preview avatar so initials/colors update live
  const previewUser = {
    avatar_url: form.avatar_url,
    first_name: form.display_name.split(/\s+/)[0] || profile.first_name,
    last_name:  form.display_name.split(/\s+/).slice(1).join(' ') || profile.last_name,
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Edit profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* ── Profile photo ─────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <UserAvatar user={previewUser} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">Profile photo</div>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">JPG or PNG, square, max 2MB</div>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={UploadCloud}
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingAvatar ? 'Uploading…' : 'Upload new'}
                </Button>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* ── Display name + Username ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Display name">
              <TextInput
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
                placeholder="e.g. Emeka Obi"
                required
              />
            </Field>
            <Field
              label="Username"
              error={usernameError}
              hint={!usernameError ? '3–20 chars, letters, numbers, underscores' : undefined}
            >
              <TextInput
                prefix="@"
                value={form.username}
                onChange={(e) => {
                  set('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20).toLowerCase())
                  if (usernameError) setUsernameError('')
                }}
                placeholder="emeka_o"
                error={!!usernameError}
              />
            </Field>
          </div>

          {/* ── Bio ───────────────────────────────────────────────────── */}
          <Field
            label="Bio"
            hint={`${form.bio.length}/160`}
          >
            <TextArea
              rows={3}
              maxLength={160}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="A little about yourself — what you sell, where you're based, anything that helps buyers trust you."
            />
          </Field>

          {/* ── Location + Phone ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Location">
              <TextInput
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Lekki, Lagos State"
              />
            </Field>
            <Field label="Phone number">
              <TextInput
                prefix="NG +234"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="801 234 5678"
              />
            </Field>
          </div>

          {/* ── Verified — Locked ─────────────────────────────────────── */}
          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-zinc-500 inline-flex items-center gap-1.5">
              Verified <span className="text-gray-400 dark:text-zinc-600">—</span>
              <span className="inline-flex items-center gap-1 text-gray-400 dark:text-zinc-600">
                <Lock size={10} /> Locked
              </span>
            </div>
            <div className="mt-2 space-y-2">
              {/* profile uses UserPublicSerializer (no email) — read from auth context for own profile */}
              <LockedRow icon={Mail} text={user?.email || '—'} verified={profile.email_verified} />

              {/* Phone — verifiable inline */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Phone size={14} className={phoneVerifiedLocal ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'} />
                  <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-zinc-300 truncate">
                    {profile.phone || 'Add a phone number above'}
                  </span>
                  {phoneVerifiedLocal ? (
                    <span className="relative w-9 h-5 rounded-full bg-emerald-500" title="Verified">
                      <span className="absolute top-0.5 left-[18px] w-4 h-4 bg-white rounded-full shadow" />
                    </span>
                  ) : profile.phone ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={sendingPhoneOtp}
                      className="text-xs font-medium text-brand hover:underline disabled:opacity-60"
                    >
                      {sendingPhoneOtp ? 'Sending…' : phoneOtpSent ? 'Resend' : 'Verify'}
                    </button>
                  ) : (
                    <span className="relative w-9 h-5 rounded-full bg-gray-200 dark:bg-zinc-700">
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow" />
                    </span>
                  )}
                </div>

                {phoneOtpSent && !phoneVerifiedLocal && (
                  <div className="px-3 pb-3 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      className="flex-1 h-9 px-3 text-sm tracking-widest font-mono rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleVerifyPhoneOtp}
                      disabled={verifyingPhoneOtp || phoneOtp.length !== 6}
                    >
                      {verifyingPhoneOtp ? 'Verifying…' : 'Confirm'}
                    </Button>
                  </div>
                )}
              </div>

              <LockedRow icon={ShieldCheck} text="NIN + BVN verified" verified={profile.kyc_verified || profile.bvn_verified} />
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-zinc-500">
              Email and identity verifications are managed in Settings → Account. Verify your phone above.
            </p>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800 -mx-5 px-5 pb-0 mt-2 -mb-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || uploadingAvatar}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Read-only locked row in the Verified section
function LockedRow({ icon: Icon, text, verified }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40">
      <Icon size={14} className={verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'} />
      <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-zinc-300 truncate">{text || '—'}</span>
      <span
        className={`relative w-9 h-5 rounded-full ${verified ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
        title={verified ? 'Verified' : 'Not verified'}
        aria-label={verified ? 'Verified' : 'Not verified'}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow ${verified ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
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
            {profile.bio && (
              <Card>
                <SectionLabel>Bio</SectionLabel>
                <p className="mt-1.5 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{profile.bio}</p>
              </Card>
            )}
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
                <VerificationBadge icon={Mail}        label="Email"        verified={!!profile.email_verified} />
                <VerificationBadge icon={Phone}       label="Phone"        verified={!!profile.phone_verified} />
                <VerificationBadge icon={ShieldCheck} label="NIN + Selfie" verified={!!profile.kyc_verified} />
                <VerificationBadge icon={CreditCard}  label="BVN"          verified={!!profile.bvn_verified} />
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
