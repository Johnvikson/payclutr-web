import { useMemo, useState } from 'react'
import {
  BadgePercent, Bell, BookOpen, CreditCard, Edit3,
  Eye, Globe2, Image, Megaphone, Save, Search, ShieldCheck, SlidersHorizontal,
} from 'lucide-react'
import { useToast } from '../../components/ui/Toast.jsx'

const STORAGE_KEY = 'payclutr_cms_settings'

const DEFAULT_SETTINGS = {
  general: {
    siteName: 'PayClutr',
    tagline: "Nigeria's declutter marketplace",
    description: "Sell what you don't need, buy what you do, with every payment protected by escrow.",
    contactEmail: 'hello@payclutr.com',
    supportEmail: 'support@payclutr.com',
    supportPhone: '+234 800 PAYCLUTR',
    address: '14 Admiralty Way, Lekki Phase 1, Lagos',
    rcNumber: 'RC 1845921',
    logoUrl: '/payclutr-mark-rounded.png',
  },
  fees: {
    sellerFeePct: 5,
    escrowFeeFlat: 100,
    withdrawalFeeFlat: 50,
    minWithdrawal: 1000,
    autoReleaseAfterDays: 3,
    disputeWindowDays: 7,
  },
  seo: {
    metaTitle: 'PayClutr - Declutter & sell with confidence',
    metaDescription: "Nigeria's declutter marketplace. Buy and sell safely with escrow protection.",
    keywords: 'declutter, marketplace, escrow, nigeria, secondhand',
    canonicalUrl: 'https://payclutr.com',
    indexable: true,
  },
  maintenance: {
    maintenanceMode: false,
    announcementEnabled: true,
    announcementText: 'Phone verification is now required before checkout.',
    signupsEnabled: true,
    listingsEnabled: true,
    withdrawalsEnabled: true,
  },
  categories: [
    { id: 'phones', name: 'Phones & Tablets', requiresReceipt: true, active: true },
    { id: 'electronics', name: 'Electronics', requiresReceipt: true, active: true },
    { id: 'fashion', name: 'Fashion', requiresReceipt: false, active: true },
    { id: 'home', name: 'Home & Living', requiresReceipt: false, active: true },
  ],
  banners: [
    { id: 'b1', title: 'Trade safely with escrow', body: 'Pay only through PayClutr. Funds stay protected until delivery is confirmed.', tone: 'orange', active: true },
    { id: 'b2', title: 'Verify before you list', body: 'Sellers must complete ID verification before their products go live.', tone: 'green', active: true },
  ],
  notifications: {
    orderPlaced: { email: true, sms: false, push: true, inApp: true },
    escrowFunded: { email: true, sms: true, push: true, inApp: true },
    listingApproved: { email: true, sms: false, push: true, inApp: true },
    kycApproved: { email: true, sms: true, push: true, inApp: true },
    withdrawalSent: { email: true, sms: true, push: true, inApp: true },
    disputeOpened: { email: true, sms: true, push: true, inApp: true },
  },
}

const TABS = [
  { id: 'general', label: 'General', icon: Globe2, group: 'Brand' },
  { id: 'fees', label: 'Fees', icon: BadgePercent, group: 'Operations' },
  { id: 'seo', label: 'SEO', icon: Eye, group: 'Content' },
  { id: 'maintenance', label: 'Maintenance', icon: SlidersHorizontal, group: 'Operations' },
  { id: 'categories', label: 'Categories', icon: BookOpen, group: 'Content' },
  { id: 'banners', label: 'Banners', icon: Megaphone, group: 'Content' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Access' },
]

const notificationLabels = {
  orderPlaced: 'Order placed',
  escrowFunded: 'Escrow funded',
  listingApproved: 'Listing approved',
  kycApproved: 'KYC approved',
  withdrawalSent: 'Withdrawal sent',
  disputeOpened: 'Dispute opened',
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </label>
  )
}

function Input({ value, onChange, type = 'text', prefix, suffix }) {
  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10">
      {prefix && <span className="pl-3 text-sm text-gray-400">{prefix}</span>}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2 text-sm text-gray-900 outline-none"
      />
      {suffix && <span className="pr-3 text-sm text-gray-400">{suffix}</span>}
    </div>
  )
}

function Textarea({ value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
    />
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Card({ title, description, children, action }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function AdminCMSPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(loadSettings)
  const [active, setActive] = useState('general')
  const [search, setSearch] = useState('')

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)
  const tab = TABS.find((item) => item.id === active)

  const updateSection = (patch) => setSettings((current) => ({
    ...current,
    [active]: { ...current[active], ...patch },
  }))

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(settings)
    showToast('CMS changes saved', 'success')
  }

  const visibleTabs = useMemo(() => (
    TABS.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()) || item.group.toLowerCase().includes(search.toLowerCase()))
  ), [search])

  return (
    <div className="min-h-full bg-gray-50 px-5 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin CMS</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Content & Platform Controls</h1>
            <p className="mt-1 text-sm text-gray-500">Manage public content, fees, announcements, categories, and notification rules.</p>
          </div>
          <button onClick={save} disabled={!dirty} className="btn-primary disabled:opacity-50">
            <Save size={16} /> Save changes
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl border border-gray-100 bg-white p-3 shadow-xs">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search CMS" className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="space-y-1">
              {visibleTabs.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      active === item.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">{item.group}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <main className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {tab && <tab.icon size={19} />}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">{tab?.label}</h2>
                  <p className="text-xs text-gray-500">{dirty ? 'Unsaved changes' : 'Saved locally for this prototype CMS'}</p>
                </div>
                <div className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">{tab?.group}</div>
              </div>
            </div>

            {active === 'general' && (
              <Card title="Brand identity" description="Company details shown across public pages and emails.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Site name"><Input value={settings.general.siteName} onChange={(v) => updateSection({ siteName: v })} /></Field>
                  <Field label="Tagline"><Input value={settings.general.tagline} onChange={(v) => updateSection({ tagline: v })} /></Field>
                  <Field label="Contact email"><Input value={settings.general.contactEmail} onChange={(v) => updateSection({ contactEmail: v })} /></Field>
                  <Field label="Support phone"><Input value={settings.general.supportPhone} onChange={(v) => updateSection({ supportPhone: v })} /></Field>
                  <Field label="RC number"><Input value={settings.general.rcNumber} onChange={(v) => updateSection({ rcNumber: v })} /></Field>
                  <Field label="Logo URL"><Input value={settings.general.logoUrl} onChange={(v) => updateSection({ logoUrl: v })} /></Field>
                  <div className="md:col-span-2"><Field label="Description"><Textarea value={settings.general.description} onChange={(v) => updateSection({ description: v })} /></Field></div>
                  <div className="md:col-span-2"><Field label="Address"><Input value={settings.general.address} onChange={(v) => updateSection({ address: v })} /></Field></div>
                </div>
              </Card>
            )}

            {active === 'fees' && (
              <Card title="Marketplace rules" description="Preview fees and operational limits before publishing them to production.">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Seller fee"><Input type="number" suffix="%" value={settings.fees.sellerFeePct} onChange={(v) => updateSection({ sellerFeePct: v })} /></Field>
                  <Field label="Escrow fee"><Input type="number" prefix="₦" value={settings.fees.escrowFeeFlat} onChange={(v) => updateSection({ escrowFeeFlat: v })} /></Field>
                  <Field label="Withdrawal fee"><Input type="number" prefix="₦" value={settings.fees.withdrawalFeeFlat} onChange={(v) => updateSection({ withdrawalFeeFlat: v })} /></Field>
                  <Field label="Minimum withdrawal"><Input type="number" prefix="₦" value={settings.fees.minWithdrawal} onChange={(v) => updateSection({ minWithdrawal: v })} /></Field>
                  <Field label="Auto-release"><Input type="number" suffix="days" value={settings.fees.autoReleaseAfterDays} onChange={(v) => updateSection({ autoReleaseAfterDays: v })} /></Field>
                  <Field label="Dispute window"><Input type="number" suffix="days" value={settings.fees.disputeWindowDays} onChange={(v) => updateSection({ disputeWindowDays: v })} /></Field>
                </div>
              </Card>
            )}

            {active === 'seo' && (
              <Card title="Search appearance" description="Metadata for public search previews and social cards.">
                <div className="space-y-4">
                  <Field label="Meta title"><Input value={settings.seo.metaTitle} onChange={(v) => updateSection({ metaTitle: v })} /></Field>
                  <Field label="Meta description"><Textarea value={settings.seo.metaDescription} onChange={(v) => updateSection({ metaDescription: v })} /></Field>
                  <Field label="Keywords"><Input value={settings.seo.keywords} onChange={(v) => updateSection({ keywords: v })} /></Field>
                  <Field label="Canonical URL"><Input value={settings.seo.canonicalUrl} onChange={(v) => updateSection({ canonicalUrl: v })} /></Field>
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div><p className="text-sm font-medium text-gray-900">Allow indexing</p><p className="text-xs text-gray-500">Search engines can crawl public pages.</p></div>
                    <Toggle checked={settings.seo.indexable} onChange={(v) => updateSection({ indexable: v })} />
                  </div>
                </div>
              </Card>
            )}

            {active === 'maintenance' && (
              <Card title="Availability" description="Control high-risk switches for signups, listings, withdrawals, and announcements.">
                <div className="space-y-3">
                  {[
                    ['maintenanceMode', 'Maintenance mode', 'Temporarily block customer access.'],
                    ['announcementEnabled', 'Announcement banner', 'Show a global notice.'],
                    ['signupsEnabled', 'New signups', 'Allow new accounts.'],
                    ['listingsEnabled', 'New listings', 'Allow sellers to list items.'],
                    ['withdrawalsEnabled', 'Withdrawals', 'Allow seller withdrawals.'],
                  ].map(([key, label, hint]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                      <div><p className="text-sm font-medium text-gray-900">{label}</p><p className="text-xs text-gray-500">{hint}</p></div>
                      <Toggle checked={settings.maintenance[key]} onChange={(v) => updateSection({ [key]: v })} />
                    </div>
                  ))}
                  <Field label="Announcement text"><Textarea value={settings.maintenance.announcementText} onChange={(v) => updateSection({ announcementText: v })} /></Field>
                </div>
              </Card>
            )}

            {active === 'categories' && (
              <Card
                title="Listing categories"
                description="Receipt-sensitive categories can be flagged for admin review."
                action={<button className="btn-secondary" onClick={() => updateSection({ categories: [...settings.categories, { id: `cat-${Date.now()}`, name: 'New category', requiresReceipt: false, active: true }] })}><Edit3 size={15} /> Add</button>}
              >
                <div className="space-y-3">
                  {settings.categories.map((cat, index) => (
                    <div key={cat.id} className="grid gap-3 rounded-lg border border-gray-100 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <Input value={cat.name} onChange={(v) => {
                        const next = [...settings.categories]
                        next[index] = { ...cat, name: v }
                        updateSection({ categories: next })
                      }} />
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600"><Toggle checked={cat.requiresReceipt} onChange={(v) => {
                        const next = [...settings.categories]
                        next[index] = { ...cat, requiresReceipt: v }
                        updateSection({ categories: next })
                      }} /> Receipt expected</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600"><Toggle checked={cat.active} onChange={(v) => {
                        const next = [...settings.categories]
                        next[index] = { ...cat, active: v }
                        updateSection({ categories: next })
                      }} /> Active</label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {active === 'banners' && (
              <Card title="Homepage banners" description="Manage operational and marketing banners.">
                <div className="grid gap-4 lg:grid-cols-2">
                  {settings.banners.map((banner, index) => (
                    <div key={banner.id} className="rounded-xl border border-gray-100 p-4">
                      <div className={`mb-4 rounded-lg p-4 ${banner.tone === 'green' ? 'bg-emerald-50 text-emerald-900' : 'bg-brand-50 text-brand-900'}`}>
                        <p className="text-sm font-semibold">{banner.title}</p>
                        <p className="mt-1 text-xs leading-5 opacity-80">{banner.body}</p>
                      </div>
                      <div className="space-y-3">
                        <Field label="Title"><Input value={banner.title} onChange={(v) => {
                          const next = [...settings.banners]
                          next[index] = { ...banner, title: v }
                          updateSection({ banners: next })
                        }} /></Field>
                        <Field label="Body"><Textarea value={banner.body} onChange={(v) => {
                          const next = [...settings.banners]
                          next[index] = { ...banner, body: v }
                          updateSection({ banners: next })
                        }} /></Field>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {active === 'notifications' && (
              <Card title="Notification matrix" description="Control channels per event. Email template content is handled in the email template editor.">
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <div className="grid grid-cols-[1fr_repeat(4,80px)] bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <span>Event</span><span>Email</span><span>SMS</span><span>Push</span><span>In-app</span>
                  </div>
                  {Object.entries(settings.notifications).map(([key, row]) => (
                    <div key={key} className="grid grid-cols-[1fr_repeat(4,80px)] items-center border-t border-gray-100 px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900">{notificationLabels[key]}</span>
                      {['email', 'sms', 'push', 'inApp'].map((channel) => (
                        <Toggle key={channel} checked={row[channel]} onChange={(v) => updateSection({ notifications: { ...settings.notifications, [key]: { ...row, [channel]: v } } })} />
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-4"><Image size={18} className="text-brand-500" /><p className="mt-3 text-sm font-semibold">Media-ready</p><p className="mt-1 text-xs text-gray-500">Image URL fields match the prototype.</p></div>
              <div className="rounded-xl border border-gray-100 bg-white p-4"><ShieldCheck size={18} className="text-emerald-500" /><p className="mt-3 text-sm font-semibold">Admin gated</p><p className="mt-1 text-xs text-gray-500">Only authenticated admin shell users can access it.</p></div>
              <div className="rounded-xl border border-gray-100 bg-white p-4"><CreditCard size={18} className="text-blue-500" /><p className="mt-3 text-sm font-semibold">Rules visible</p><p className="mt-1 text-xs text-gray-500">Fees and limits are easy to review.</p></div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
