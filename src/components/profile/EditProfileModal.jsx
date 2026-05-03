import { createElement, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Mail, Phone, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { sendPhoneOtp, updateMe, verifyPhoneOtp } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../ui/Toast.jsx'
import UserAvatar from '../ui/UserAvatar.jsx'
import Button from '../ui/Button.jsx'
import { Field, TextArea, TextInput } from '../ui/Field.jsx'
import { uploadImage } from '../../lib/supabase.js'

export default function EditProfileModal({ profile, onClose }) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const initialDisplayName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()

  const [form, setForm] = useState({
    display_name: initialDisplayName,
    username: profile?.username || '',
    bio: profile?.bio || '',
    location: [profile?.city, profile?.state].filter(Boolean).join(', '),
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || '',
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState('')
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false)
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false)
  const [phoneVerifiedLocal, setPhoneVerifiedLocal] = useState(!!profile?.phone_verified)

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      if (updated && typeof updated === 'object') updateUser(updated)
      if (profile?.id) qc.invalidateQueries({ queryKey: ['profile', String(profile.id)] })
      qc.invalidateQueries({ queryKey: ['wallet'] })
      showToast('Profile updated', 'success')
      onClose()
    },
    onError: (err) => {
      showToast(err?.detail ?? 'Failed to update profile.', 'error')
    },
  })

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

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
    } catch {
      showToast('Avatar upload failed. Please try again.', 'error')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
      if (profile?.id) qc.invalidateQueries({ queryKey: ['profile', String(profile.id)] })
    } catch (err) {
      showToast(err?.detail ?? 'Invalid OTP. Please try again.', 'error')
    } finally {
      setVerifyingPhoneOtp(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const username = form.username.trim().toLowerCase()
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameError('3-20 chars, letters, numbers, underscores')
      return
    }
    setUsernameError('')

    const parts = form.display_name.trim().split(/\s+/).filter(Boolean)
    const locationParts = form.location.split(',').map((s) => s.trim()).filter(Boolean)

    mutation.mutate({
      username: username || null,
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || '',
      bio: form.bio,
      city: locationParts[0] || '',
      state: locationParts.slice(1).join(', ') || '',
      phone: form.phone || null,
      avatar_url: form.avatar_url || null,
    })
  }

  const previewUser = {
    avatar_url: form.avatar_url,
    first_name: form.display_name.split(/\s+/)[0] || profile?.first_name,
    last_name: form.display_name.split(/\s+/).slice(1).join(' ') || profile?.last_name,
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Edit profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
                  {uploadingAvatar ? 'Uploading...' : 'Upload new'}
                </Button>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={() => set('avatar_url', '')}
                    className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Display name">
              <TextInput
                value={form.display_name}
                placeholder="e.g. Emeka Obi"
                readOnly
                aria-readonly="true"
                title="Display name is read only"
                required
              />
            </Field>
            <Field
              label="Username"
              error={usernameError}
              hint={!usernameError ? '3-20 chars, letters, numbers, underscores' : undefined}
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

          <Field label="Bio" hint={`${form.bio.length}/160`}>
            <TextArea
              rows={3}
              maxLength={160}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="A little about yourself - what you sell, where you're based, anything that helps buyers trust you."
            />
          </Field>

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

          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-zinc-500 inline-flex items-center gap-1.5">
              Verified <span className="text-gray-400 dark:text-zinc-600">-</span>
              <span className="inline-flex items-center gap-1 text-gray-400 dark:text-zinc-600">
                <Lock size={10} /> Locked
              </span>
            </div>
            <div className="mt-2 space-y-2">
              <LockedRow icon={Mail} text={user?.email || '-'} verified={profile?.email_verified} />
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Phone size={14} className={phoneVerifiedLocal ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'} />
                  <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-zinc-300 truncate">
                    {profile?.phone || 'Add a phone number above'}
                  </span>
                  {phoneVerifiedLocal ? (
                    <span className="relative w-9 h-5 rounded-full bg-emerald-500" title="Verified">
                      <span className="absolute top-0.5 left-[18px] w-4 h-4 bg-white rounded-full shadow" />
                    </span>
                  ) : profile?.phone ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={sendingPhoneOtp}
                      className="text-xs font-medium text-brand hover:underline disabled:opacity-60"
                    >
                      {sendingPhoneOtp ? 'Sending...' : phoneOtpSent ? 'Resend' : 'Verify'}
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
                      {verifyingPhoneOtp ? 'Verifying...' : 'Confirm'}
                    </Button>
                  </div>
                )}
              </div>
              <LockedRow icon={ShieldCheck} text="NIN + BVN verified" verified={profile?.kyc_verified || profile?.bvn_verified} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800 -mx-5 px-5 pb-0 mt-2 -mb-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || uploadingAvatar}>
              {mutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LockedRow({ icon: Icon, text, verified }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40">
      {createElement(Icon, {
        size: 14,
        className: verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500',
      })}
      <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-zinc-300 truncate">{text || '-'}</span>
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
