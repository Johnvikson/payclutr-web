import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock, Copy, Mail, RefreshCw, Save,
  Search, Send, ShieldAlert, Smartphone, Wallet,
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast.jsx'

const STORAGE_KEY = 'payclutr_email_templates'

const TEMPLATES = [
  { id: 'welcome', category: 'Onboarding', icon: Mail, subject: 'Welcome to PayClutr', preheader: "You just joined Nigeria's declutter marketplace.", headline: 'Welcome to PayClutr, {name}', lead: "Sell what you don't need and buy safely from others, with every payment protected by escrow.", cta: 'Complete your profile' },
  { id: 'otp', category: 'Security', icon: Smartphone, subject: 'Your PayClutr verification code', preheader: 'Use this 6-digit code to verify your email.', headline: 'Verify your email', lead: 'Use this 6-digit code to verify your email address. It expires in 15 minutes.', cta: '' },
  { id: 'password', category: 'Security', icon: ShieldAlert, subject: 'Reset your PayClutr password', preheader: 'Reset your password securely.', headline: 'Reset your password', lead: 'We got a request to reset your PayClutr password. Use the code below to choose a new one.', cta: 'Reset password' },
  { id: 'login', category: 'Security', icon: AlertTriangle, subject: 'New device signed in to your account', preheader: 'A new device accessed your PayClutr account.', headline: 'New device signed in', lead: 'Your PayClutr account was just signed in to from a new device. If this was you, no action is needed.', cta: 'Secure my account' },
  { id: 'order_placed', category: 'Orders', icon: CheckCircle2, subject: 'Order placed - held in escrow', preheader: 'Your payment is safely held by PayClutr.', headline: 'Order placed - held in escrow', lead: "Your payment is safely held by PayClutr. We'll release it to the seller only after you confirm delivery.", cta: 'Track order' },
  { id: 'escrow_funded', category: 'Orders', icon: Clock, subject: 'Buyer paid - ship now', preheader: 'Funds are locked in escrow.', headline: 'Buyer paid - ship now', lead: 'The buyer just funded escrow. Money is locked safely with PayClutr, so you can ship the item.', cta: 'View order' },
  { id: 'listing_approved', category: 'Listings', icon: CheckCircle2, subject: 'Your listing is live', preheader: 'Your listing passed review.', headline: 'Your listing is live', lead: 'Great news. Your listing passed review and is now visible to buyers across PayClutr.', cta: 'View listing' },
  { id: 'withdrawal', category: 'Wallet', icon: Wallet, subject: 'Withdrawal sent', preheader: 'Your withdrawal is on the way.', headline: 'Withdrawal sent', lead: 'Your withdrawal request has been processed. Funds usually arrive in under 30 minutes.', cta: 'View wallet' },
  { id: 'payout_failed', category: 'Wallet', icon: AlertTriangle, subject: 'Withdrawal failed - action required', preheader: "Your withdrawal couldn't be processed.", headline: 'Withdrawal failed', lead: "We couldn't send your withdrawal to your bank. The money is back in your PayClutr wallet.", cta: 'Update bank details' },
  { id: 'kyc_approved', category: 'Account', icon: CheckCircle2, subject: "You're verified on PayClutr", preheader: 'Your identity has been confirmed.', headline: "You're verified", lead: 'Your identity has been confirmed. You can now buy, sell, and withdraw with higher trust.', cta: 'List your first item' },
  { id: 'dispute', category: 'Disputes', icon: AlertTriangle, subject: 'A dispute was opened', preheader: 'Funds are frozen while our team reviews.', headline: 'A dispute was opened', lead: 'A dispute was opened on this order. Funds are now frozen in escrow while our team reviews.', cta: 'Respond to dispute' },
  { id: 'refund', category: 'Disputes', icon: Wallet, subject: 'Your refund is on the way', preheader: 'Your refund has been issued.', headline: 'Your refund is on the way', lead: 'We have processed your refund. The full amount is back in your PayClutr wallet.', cta: 'View wallet' },
  { id: 'review', category: 'Orders', icon: Mail, subject: 'How was your trade?', preheader: 'Leave a quick review.', headline: 'How was your trade?', lead: 'A quick rating helps the community trust the right sellers.', cta: 'Leave a review' },
]

function loadDrafts() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.fromEntries(TEMPLATES.map((template) => [template.id, { ...template, ...stored[template.id] }]))
  } catch {
    return Object.fromEntries(TEMPLATES.map((template) => [template.id, template]))
  }
}

function EmailPreview({ template }) {
  const name = 'Emeka'
  const headline = template.headline.replace('{name}', name)
  return (
    <div className="rounded-xl bg-gray-100 p-4">
      <div className="mx-auto max-w-[600px] overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="bg-brand-500 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/payclutr-mark-rounded.png" alt="PayClutr" className="h-7 w-7 rounded-lg" />
              <span className="text-lg font-bold text-white">PayClutr</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">{template.category}</span>
          </div>
        </div>
        <div className="px-8 py-8 text-[15px] leading-7 text-gray-700">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">{headline}</h2>
          <p className="mt-5">Hi {name},</p>
          <p className="mt-3">{template.lead}</p>
          {template.id === 'otp' && (
            <div className="my-6 rounded-xl border border-gray-100 bg-gray-50 px-6 py-5 text-center font-mono text-4xl font-bold tracking-[0.24em] text-gray-950">
              482196
            </div>
          )}
          {['order_placed', 'escrow_funded', 'withdrawal', 'refund', 'dispute'].includes(template.id) && (
            <div className="my-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Reference</span><span className="font-mono font-semibold">PC-2841</span></div>
              <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Amount</span><span className="font-semibold">₦487,500</span></div>
              <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Status</span><span className="font-semibold">Protected by escrow</span></div>
            </div>
          )}
          {template.cta && (
            <button className="mt-5 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white">{template.cta}</button>
          )}
          <p className="mt-7 text-sm text-gray-500">PayClutr Team</p>
        </div>
      </div>
      <div className="mx-auto mt-5 max-w-[600px] text-center text-xs leading-6 text-gray-500">
        <strong className="text-gray-700">PayClutr Technologies Ltd</strong><br />
        Lagos, Nigeria · Help center · Contact us · Unsubscribe
      </div>
    </div>
  )
}

function Textarea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
      />
    </label>
  )
}

export default function AdminEmailTemplatesPage() {
  const { showToast } = useToast()
  const [drafts, setDrafts] = useState(loadDrafts)
  const [selectedId, setSelectedId] = useState('welcome')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dirty, setDirty] = useState({})

  const categories = ['all', ...new Set(TEMPLATES.map((template) => template.category))]
  const visible = useMemo(() => (
    TEMPLATES.filter((template) => {
      const draft = drafts[template.id]
      const matchesCategory = filter === 'all' || template.category === filter
      const matchesSearch = `${draft.subject} ${draft.preheader} ${draft.headline}`.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  ), [drafts, filter, search])

  const selected = drafts[selectedId]

  const update = (key, value) => {
    setDrafts((current) => ({ ...current, [selectedId]: { ...current[selectedId], [key]: value } }))
    setDirty((current) => ({ ...current, [selectedId]: true }))
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    setDirty({})
    showToast('Email templates saved', 'success')
  }

  const reset = () => {
    const original = TEMPLATES.find((template) => template.id === selectedId)
    setDrafts((current) => ({ ...current, [selectedId]: original }))
    setDirty((current) => {
      const next = { ...current }
      delete next[selectedId]
      return next
    })
  }

  return (
    <div className="min-h-full bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Notification templates</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Email Template Center</h1>
            <p className="mt-1 text-sm text-gray-500">Edit copy, preview branded emails, and keep transactional messaging consistent.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => showToast('Test email queued in prototype mode', 'success')} className="btn-secondary"><Send size={15} /> Test send</button>
            <button onClick={save} disabled={!Object.keys(dirty).length} className="btn-primary disabled:opacity-50"><Save size={15} /> Save all</button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[320px_1fr_360px]">
          <aside className="rounded-xl border border-gray-100 bg-white p-3 shadow-xs">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates" className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="mb-3 flex gap-1 overflow-x-auto">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setFilter(cat)} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${filter === cat ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{cat}</button>
              ))}
            </div>
            <div className="space-y-1">
              {visible.map((template) => {
                const draft = drafts[template.id]
                const Icon = template.icon
                const active = selectedId === template.id
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedId(template.id)}
                    className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${active ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-950">{draft.subject}</p>
                          {dirty[template.id] && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{draft.preheader}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{template.category}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <main className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {selected && <selected.icon size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-gray-950">{selected.subject}</h2>
                  <p className="text-xs text-gray-500">{selected.category} · {dirty[selectedId] ? 'Unsaved draft' : 'Saved'}</p>
                </div>
                <button onClick={() => navigator.clipboard?.writeText(selected.subject)} className="btn-secondary"><Copy size={15} /> Copy</button>
              </div>
            </div>
            <EmailPreview template={selected} />
          </main>

          <aside className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-950">Template copy</h2>
                <p className="mt-1 text-xs text-gray-500">Use {'{name}'} to personalize headlines.</p>
              </div>
              <button onClick={reset} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><RefreshCw size={16} /></button>
            </div>
            <div className="space-y-4">
              <Textarea label="Subject" value={selected.subject} onChange={(v) => update('subject', v)} rows={2} />
              <Textarea label="Preheader" value={selected.preheader} onChange={(v) => update('preheader', v)} rows={2} />
              <Textarea label="Headline" value={selected.headline} onChange={(v) => update('headline', v)} rows={2} />
              <Textarea label="Lead copy" value={selected.lead} onChange={(v) => update('lead', v)} rows={5} />
              <Textarea label="CTA label" value={selected.cta} onChange={(v) => update('cta', v)} rows={2} />
            </div>
            <div className="mt-5 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-500">
              <p className="font-semibold text-gray-700">Live integration note</p>
              <p className="mt-1">This mirrors the prototype editor. Backend email helpers now use the same branded frame for active transactional emails.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
