import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Camera, X, Truck, Package, Zap, MapPin, AlertCircle } from 'lucide-react'
import { useToast } from '../../components/ui/Toast.jsx'
import { createListing } from '../../api/endpoints.js'
import { uploadImage } from '../../lib/supabase.js'
import { CATEGORIES, NIGERIAN_STATES } from '../../utils/constants.js'
import { formatNaira } from '../../utils/formatters.js'

const STEPS = [
  { n: 1, label: 'Item Details' },
  { n: 2, label: 'Photos' },
  { n: 3, label: 'Shipping' },
  { n: 4, label: 'Location' },
  { n: 5, label: 'Review' },
]

const CONDITIONS = [
  { key: 'excellent', label: 'Excellent',  desc: 'Brand new or barely used' },
  { key: 'very_good', label: 'Very Good',  desc: 'Minor signs of use, works perfectly' },
  { key: 'good',      label: 'Good',       desc: 'Visible use but fully functional' },
  { key: 'fair',      label: 'Fair',       desc: 'Noticeable wear but still works' },
]

const SHIP_METHODS = [
  { key: 'shipping_park',         icon: Truck,   label: 'Park Waybill',   desc: "Send via park transport to buyer's city",       note: "Find a reliable driver at the park heading to the buyer's destination. Take a handover photo and share driver details in order chat.", confirmKey: null },
  { key: 'shipping_gig',          icon: Package, label: 'GIG Logistics',  desc: "Nigeria's leading courier service",             note: 'Buyer pays GIG directly after you confirm weight-based cost in chat.', confirmKey: 'gig_confirmed', confirmLabel: 'I confirm a GIG Logistics office is available at my location' },
  { key: 'shipping_bolt_indrive', icon: Zap,     label: 'Bolt / InDrive', desc: 'Ride-hailing delivery option',                  note: 'Buyer books the ride and pays driver directly on delivery.', confirmKey: 'bolt_confirmed', confirmLabel: 'I confirm Bolt/InDrive delivery is available at my location' },
  { key: 'shipping_pickup',       icon: MapPin,  label: 'Local Pickup',   desc: 'Buyer comes to you',                            note: 'An OTP will be generated at handover to confirm receipt.', confirmKey: null },
]

const EMPTY_FORM = {
  title: '', description: '', category: '', condition: '', price: '',
  photos: [],
  shipping_park: false, shipping_gig: false, gig_confirmed: false,
  shipping_bolt_indrive: false, bolt_confirmed: false, shipping_pickup: false,
  state: '', city: '',
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
              n < current  ? 'bg-green-500 border-green-500 text-white' :
              n === current ? 'border-brand-500 text-brand-600 bg-brand-50' :
                             'border-gray-200 text-gray-400 bg-white'
            }`}>
              {n < current ? <Check size={14} strokeWidth={3} /> : n}
            </div>
            <span className={`text-[10px] font-medium mt-1 hidden sm:block ${
              n === current ? 'text-brand-600' : n < current ? 'text-green-600' : 'text-gray-400'
            }`}>{label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-14 mx-1 transition-colors ${n < current ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CreateListingPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [publishing, setPublishing] = useState(false)

  function set(key, value) {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }))
  }

  const addFiles = useCallback((files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .slice(0, 8 - form.photos.length)
    if (!valid.length) return
    valid.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) =>
        setForm((p) => ({ ...p, photos: [...p.photos, { file, preview: e.target.result }].slice(0, 8) }))
      reader.readAsDataURL(file)
    })
  }, [form.photos.length])

  function removePhoto(idx) {
    setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== idx) }))
  }

  function validate() {
    const e = {}
    if (step === 1) {
      if (!form.title.trim())       e.title = 'Title is required'
      if (!form.description.trim()) e.description = 'Description is required'
      if (!form.category)           e.category = 'Select a category'
      if (!form.condition)          e.condition = 'Select a condition'
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price'
    }
    if (step === 2 && form.photos.length < 2) e.photos = 'Add at least 2 photos to continue'
    if (step === 3 && !SHIP_METHODS.some((m) => form[m.key])) e.shipping = 'Select at least one shipping method'
    if (step === 4) {
      if (!form.state)        e.state = 'Select your state'
      if (!form.city.trim())  e.city  = 'Enter your city'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() { if (validate()) setStep((s) => s + 1) }
  function back() { setStep((s) => s - 1); setErrors({}) }

  async function publish() {
    setPublishing(true)
    try {
      const uploadedImages = await Promise.all(
        form.photos.map(async ({ file }, i) => {
          const url = await uploadImage(file)
          return { image_url: url, is_primary: i === 0, sort_order: i }
        })
      )
      const { photos: _photos, gig_confirmed: _g, bolt_confirmed: _b, ...rest } = form
      const result = await createListing({ ...rest, price: Number(form.price) * 100, images: uploadedImages })
      showToast('Listing published successfully!', 'success')
      navigate(`/listings/${result.id}`)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to publish. Please try again.'
      showToast(msg, 'error')
    } finally {
      setPublishing(false)
    }
  }

  const Step1 = (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="form-label mb-0">Title</label>
          <span className="text-xs text-gray-400">{form.title.length}/100</span>
        </div>
        <input type="text" maxLength={100} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Samsung 55 inch Smart TV (barely used)" className={`input-field ${errors.title ? 'input-error' : ''}`} />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <label className="form-label mb-0">Description</label>
          <span className="text-xs text-gray-400">{form.description.length}/500</span>
        </div>
        <textarea maxLength={500} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the item — condition, what's included, any defects..." className={`input-field resize-none ${errors.description ? 'input-error' : ''}`} />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div>
        <label className="form-label">Category</label>
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className={`input-field ${errors.category ? 'input-error' : ''}`}>
          <option value="">Select category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <p className="form-error">{errors.category}</p>}
      </div>

      <div>
        <label className="form-label">Condition</label>
        <div className="grid grid-cols-2 gap-3">
          {CONDITIONS.map(({ key, label, desc }) => (
            <button key={key} type="button" onClick={() => set('condition', key)} className={`relative p-3.5 rounded-xl border-2 text-left transition-colors ${form.condition === key ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
              {form.condition === key && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
              )}
              <p className={`text-sm font-semibold ${form.condition === key ? 'text-brand-700' : 'text-gray-900'}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
        {errors.condition && <p className="form-error mt-1">{errors.condition}</p>}
      </div>

      <div>
        <label className="form-label">Price (₦)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₦</span>
          <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className={`input-field pl-8 ${errors.price ? 'input-error' : ''}`} />
        </div>
        {errors.price && <p className="form-error">{errors.price}</p>}
      </div>
    </div>
  )

  const Step2 = (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Add at least 2 photos. The first photo will be your main listing photo. Max 8 photos, 5MB each.</p>

      {form.photos.length < 8 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            isDragging ? 'border-brand-500 bg-brand-50' : errors.photos ? 'border-red-300' : 'border-gray-200 hover:border-brand-400 hover:bg-brand-50'
          }`}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera size={20} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Drag photos here or tap to upload</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — max 5MB each</p>
          </div>
          <p className="text-xs font-medium text-brand-600">{form.photos.length} / 8 photos</p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

      {errors.photos && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} />{errors.photos}
        </div>
      )}

      {form.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {form.photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
              <img src={photo.preview} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold text-white bg-brand-500 px-1.5 py-0.5 rounded-md">
                  Main
                </span>
              )}
              <button onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                <X size={11} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const Step3 = (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-1">Select all shipping methods available to buyers.</p>
      {errors.shipping && (
        <div className="flex items-center gap-2 text-sm text-red-500 mb-2">
          <AlertCircle size={14} />{errors.shipping}
        </div>
      )}
      {SHIP_METHODS.map(({ key, icon: Icon, label, desc, note, confirmKey, confirmLabel }) => {
        const selected = form[key]
        return (
          <div key={key} className={`rounded-xl border-2 transition-colors ${selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'}`}>
            <button type="button" onClick={() => set(key, !selected)} className="w-full flex items-center gap-3 p-4 text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${selected ? 'text-brand-700' : 'text-gray-900'}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
                {selected && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>
            </button>
            {selected && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-2.5 border border-brand-100">{note}</p>
                {confirmKey && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <div
                      onClick={() => set(confirmKey, !form[confirmKey])}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${form[confirmKey] ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}
                    >
                      {form[confirmKey] && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-xs text-gray-600">{confirmLabel}</span>
                  </label>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const Step4 = (
    <div className="space-y-5">
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>Your exact address is never shared publicly. Only city and state are shown on your listing.</span>
      </div>
      <div>
        <label className="form-label">State</label>
        <select value={form.state} onChange={(e) => set('state', e.target.value)} className={`input-field ${errors.state ? 'input-error' : ''}`}>
          <option value="">Select your state</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.state && <p className="form-error">{errors.state}</p>}
      </div>
      <div>
        <label className="form-label">City / Area</label>
        <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Lekki, Wuse, Enugu GRA" className={`input-field ${errors.city ? 'input-error' : ''}`} />
        {errors.city && <p className="form-error">{errors.city}</p>}
      </div>
    </div>
  )

  const Step5 = (
    <div className="space-y-5">
      <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl text-xs text-green-700">
        <Check size={14} className="shrink-0 mt-0.5" strokeWidth={3} />
        <span>Your listing goes live immediately after publishing.</span>
      </div>

      {form.photos[0] && (
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
          <img src={form.photos[0].preview} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {[
        { title: 'Item Details', step: 1, rows: [['Title', form.title], ['Category', form.category], ['Condition', CONDITIONS.find((c) => c.key === form.condition)?.label || form.condition], ['Price', form.price ? formatNaira(Number(form.price) * 100) : '—']] },
        { title: 'Photos', step: 2, custom: (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.photos.map((p, i) => <div key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200"><img src={p.preview} alt="" className="w-full h-full object-cover" /></div>)}
          </div>
        )},
        { title: 'Shipping Methods', step: 3, rows: SHIP_METHODS.filter((m) => form[m.key]).map((m) => [m.label, '✓']) },
        { title: 'Location', step: 4, rows: [['Location', `${form.city}, ${form.state}`]] },
      ].map(({ title, step: s, rows, custom }) => (
        <div key={title} className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <button onClick={() => setStep(s)} className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">Edit</button>
          </div>
          {custom || (
            <div className="space-y-1.5">
              {rows?.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const STEP_CONTENT = [Step1, Step2, Step3, Step4, Step5]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Create Listing</h1>
      <p className="text-sm text-gray-400 mb-8">List your item and start selling in minutes.</p>

      <StepIndicator current={step} />

      <div className="mb-8">{STEP_CONTENT[step - 1]}</div>

      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={back} className="btn-secondary flex-1 py-3">← Back</button>
        )}
        {step < 5 ? (
          <button onClick={next} className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            Next →
          </button>
        ) : (
          <button onClick={publish} disabled={publishing} className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {publishing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Publishing…
              </span>
            ) : 'Publish Listing'}
          </button>
        )}
      </div>
    </div>
  )
}
