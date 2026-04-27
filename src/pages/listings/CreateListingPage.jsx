import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Camera, X, UploadCloud, AlertCircle, Truck, Package, Zap, MapPin,
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { createListing, updateListing, getListing } from '../../api/endpoints.js'
import { uploadImage } from '../../lib/supabase.js'
import { CATEGORIES, NIGERIAN_STATES } from '../../utils/constants.js'

import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { Field, TextInput, TextArea, Select, Checkbox } from '../../components/ui/Field.jsx'

const CONDITIONS = [
  { key: 'excellent', label: 'Excellent — like new' },
  { key: 'very_good', label: 'Very Good — minor wear' },
  { key: 'good',      label: 'Good — visible wear' },
  { key: 'fair',      label: 'Fair — well used' },
]

const SHIP_METHODS = [
  {
    key: 'shipping_park',
    icon: Truck,
    label: 'Park Waybill',
    sub: 'Bus park courier — driver hands off to buyer',
    note: 'Find a reliable driver heading to the buyer\'s destination, take a handover photo, and share driver details in chat.',
    confirmKey: null,
  },
  {
    key: 'shipping_gig',
    icon: Package,
    label: 'GIG Logistics',
    sub: 'Door delivery via GIG — buyer pays courier directly',
    note: 'Buyer pays GIG directly after you confirm weight-based cost in chat.',
    confirmKey: 'gig_confirmed',
    confirmLabel: 'I confirm a GIG Logistics office is available at my location',
  },
  {
    key: 'shipping_bolt_indrive',
    icon: Zap,
    label: 'Bolt / InDrive',
    sub: 'Same-city dispatch — buyer books and pays driver',
    note: 'Buyer books the ride and pays the driver directly on delivery.',
    confirmKey: 'bolt_confirmed',
    confirmLabel: 'I confirm Bolt/InDrive delivery is available at my location',
  },
  {
    key: 'shipping_pickup',
    icon: MapPin,
    label: 'Local Pickup',
    sub: 'Buyer collects in person — free',
    note: 'An OTP will be generated at handover to confirm receipt.',
    confirmKey: null,
  },
]

const EMPTY_FORM = {
  title: '', description: '', category: '', condition: '', price: '',
  photos: [],
  shipping_park: false,
  shipping_gig: false, gig_confirmed: false,
  shipping_bolt_indrive: false, bolt_confirmed: false,
  shipping_pickup: false,
  state: '', city: '',
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

export default function CreateListingPage() {
  const navigate = useNavigate()
  const { id } = useParams() // present on /listings/:id/edit
  const isEditing = Boolean(id)
  const { showToast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── KYC guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const status = user.kyc_status
    if (status === 'verified') return
    if (status === 'pending') {
      showToast('Your identity verification is under review. You can sell once approved.', 'error')
      navigate(-1)
    } else {
      const msg = status === 'rejected'
        ? 'Your KYC was rejected. Please resubmit your documents.'
        : 'Please complete identity verification before selling.'
      showToast(msg, 'error')
      navigate('/kyc', { replace: true })
    }
  }, [user])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load existing listing when editing ──────────────────────────────────
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!existing) return
    setForm((prev) => ({
      ...prev,
      title:       existing.title || '',
      description: existing.description || '',
      category:    existing.category || '',
      condition:   existing.condition || '',
      price:       existing.price ? String(existing.price / 100) : '',
      shipping_park:         !!existing.shipping_park,
      shipping_gig:          !!existing.shipping_gig,
      gig_confirmed:         !!existing.gig_confirmed,
      shipping_bolt_indrive: !!existing.shipping_bolt_indrive,
      bolt_confirmed:        !!existing.bolt_confirmed,
      shipping_pickup:       !!existing.shipping_pickup,
      state: existing.state || '',
      city:  existing.city || '',
      // existing image URLs come back as { id, image_url, ... }; treat them as already-uploaded
      photos: (existing.images || []).map((img, i) => ({
        existing: true,
        url: img.image_url,
        preview: img.image_url,
        is_primary: img.is_primary ?? i === 0,
        sort_order: img.sort_order ?? i,
      })),
    }))
  }, [existing])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
  }

  const addFiles = useCallback((files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
    if (!valid.length) return
    valid.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) =>
        setForm((p) => ({
          ...p,
          photos: [...p.photos, { file, preview: e.target.result }].slice(0, 8),
        }))
      reader.readAsDataURL(file)
    })
    if (errors.photos) setErrors((p) => ({ ...p, photos: '' }))
  }, [errors.photos])

  const removePhoto = (idx) => {
    setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== idx) }))
  }

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category)           e.category    = 'Select a category'
    if (!form.condition)          e.condition   = 'Select a condition'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      e.price = 'Enter a valid price'
    }
    if (form.photos.length < 2)   e.photos      = 'Add at least 2 photos'
    if (!SHIP_METHODS.some((m) => form[m.key])) {
      e.shipping = 'Select at least one shipping method'
    }
    // Required confirmations for GIG / Bolt
    if (form.shipping_gig          && !form.gig_confirmed)  e.gig_confirmed  = 'Please confirm GIG availability'
    if (form.shipping_bolt_indrive && !form.bolt_confirmed) e.bolt_confirmed = 'Please confirm Bolt/InDrive availability'
    if (!form.state)              e.state       = 'Select your state'
    if (!form.city.trim())        e.city        = 'Enter your city'
    setErrors(e)
    if (Object.keys(e).length) {
      showToast('Please fix the highlighted fields', 'error')
    }
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      // Upload only NEW photos (existing ones already have a URL)
      const uploadedImages = await Promise.all(
        form.photos.map(async (photo, i) => {
          if (photo.existing) {
            return { image_url: photo.url, is_primary: i === 0, sort_order: i }
          }
          const url = await uploadImage(photo.file)
          return { image_url: url, is_primary: i === 0, sort_order: i }
        })
      )
      const { photos: _photos, ...rest } = form
      const payload = {
        ...rest,
        price: Math.round(Number(form.price) * 100),
        images: uploadedImages,
      }
      const result = isEditing
        ? await updateListing(id, payload)
        : await createListing(payload)
      if (isEditing) {
        showToast('Listing updated', 'success')
        navigate(`/listings/${result.id || id}`)
      } else {
        showToast('Listing submitted for review. We\'ll notify you once it\'s approved.', 'success')
        navigate('/listings/my?tab=pending_review')
      }
    } catch (err) {
      const msg = err?.detail ?? err?.message ?? 'Failed to publish. Please try again.'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const charCount = useMemo(() => ({
    title: form.title.length,
    description: form.description.length,
  }), [form.title, form.description])

  if (isEditing && loadingExisting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)] pb-24 lg:pb-10">
      <div className="px-4 lg:px-8 py-6 max-w-[680px] mx-auto">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
          {isEditing ? 'Edit listing' : 'List a new item'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
          Sell to buyers across Nigeria. Funds held in escrow until delivery.
        </p>

        <div className="mt-6 space-y-4">

          {/* ── Item details ──────────────────────────────────────────── */}
          <Card>
            <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-4">Item details</h3>
            <div className="space-y-3">
              <Field
                label="Title"
                error={errors.title}
                hint={!errors.title && `${charCount.title}/100`}
              >
                <TextInput
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. iPhone 13 Pro 256GB — Sierra Blue"
                  error={errors.title}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Category" error={errors.category}>
                  <Select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>

                <Field label="Condition" error={errors.condition}>
                  <Select
                    value={form.condition}
                    onChange={(e) => set('condition', e.target.value)}
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="Description"
                error={errors.description}
                hint={!errors.description && `${charCount.description}/500`}
              >
                <TextArea
                  rows={4}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe your item — condition, what's included, why you're selling…"
                  error={errors.description}
                />
              </Field>

              <Field label="Price" error={errors.price}>
                <TextInput
                  prefix="₦"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="0"
                  error={errors.price}
                />
              </Field>
            </div>
          </Card>

          {/* ── Photos ─────────────────────────────────────────────── */}
          <Card>
            <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Photos</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 mb-4">
              Add up to 8 photos. The first photo is your cover. JPG, PNG, WEBP — max 5MB each.
            </p>

            {form.photos.length < 8 && (
              <button
                type="button"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                  isDragging
                    ? 'border-brand bg-orange-50 dark:bg-orange-950/20'
                    : errors.photos
                    ? 'border-red-300 dark:border-red-900'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-brand hover:bg-orange-50/30 dark:hover:bg-orange-950/10'
                } text-gray-500 dark:text-zinc-400`}
              >
                <UploadCloud size={24} />
                <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Drag photos here, or click to upload
                </div>
                <div className="text-xs text-gray-400 dark:text-zinc-500">
                  {form.photos.length} / 8 photos
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            {errors.photos && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle size={14} /> {errors.photos}
              </div>
            )}

            {form.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {form.photos.map((photo, i) => (
                  <div
                    key={i}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 ${
                      i === 0 ? 'ring-2 ring-brand' : ''
                    }`}
                  >
                    <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <Badge tone="brand" size="xs" dot={false} className="absolute bottom-1 left-1">
                        Cover
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                      aria-label="Remove photo"
                    >
                      <X size={11} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Shipping options ──────────────────────────────────── */}
          <Card>
            <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Shipping options</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 mb-4">
              Pick every method you can offer. Buyers choose at checkout.
            </p>

            {errors.shipping && (
              <div className="mb-3 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle size={14} /> {errors.shipping}
              </div>
            )}

            <div className="space-y-3">
              {SHIP_METHODS.map(({ key, icon: Icon, label, sub, note, confirmKey, confirmLabel }) => {
                const on = form[key]
                return (
                  <div
                    key={key}
                    className={`rounded-lg border transition-colors ${
                      on
                        ? 'border-brand/40 bg-orange-50/30 dark:bg-orange-950/5'
                        : 'border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => set(key, !on)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        on
                          ? 'bg-brand text-white'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">{label}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{sub}</div>
                      </div>
                      <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        on ? 'bg-brand' : 'bg-gray-200 dark:bg-zinc-700'
                      }`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          on ? 'left-[18px]' : 'left-0.5'
                        }`} />
                      </span>
                    </button>

                    {on && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-xs text-gray-700 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
                          {note}
                        </p>
                        {confirmKey && (
                          <div>
                            <Checkbox
                              checked={form[confirmKey]}
                              onChange={(v) => set(confirmKey, v)}
                              label={confirmLabel}
                            />
                            {errors[confirmKey] && (
                              <p className="text-xs text-red-600 mt-1">{errors[confirmKey]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* ── Location ──────────────────────────────────────────── */}
          <Card>
            <h3 className="text-base font-semibold text-gray-800 dark:text-zinc-200">Location</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 mb-4">
              Only the city and state are shown publicly — never your full address.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="State" error={errors.state}>
                <Select
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="City / Area" error={errors.city}>
                <TextInput
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Lekki"
                  error={errors.city}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Actions ───────────────────────────────────────────── */}
        {/* Desktop: right-aligned bar */}
        <div className="hidden lg:flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting
              ? (isEditing ? 'Saving…' : 'Publishing…')
              : (isEditing ? 'Save changes' : 'Publish listing')}
          </Button>
        </div>

        {/* Mobile: sticky bottom bar (above the BottomTabBar) */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 px-4 py-3 flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </Button>
          <Button full onClick={submit} disabled={submitting}>
            {submitting
              ? (isEditing ? 'Saving…' : 'Publishing…')
              : (isEditing ? 'Save changes' : 'Publish listing')}
          </Button>
        </div>
      </div>
    </div>
  )
}
