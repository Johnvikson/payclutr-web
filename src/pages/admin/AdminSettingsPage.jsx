import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../../api/endpoints.js'
import { useToast } from '../../components/ui/Toast.jsx'

const EVENTS = [
  'New Order',
  'Order Confirmed',
  'Item Dispatched',
  'Delivery Confirmed',
  'Dispute Raised',
  'Dispute Resolved',
  'Withdrawal Processed',
  'KYC Update',
]

function SettingGroup({ title, children, onSave, saving }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
      <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>
      <div className="space-y-4">
        {children}
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

function Field({ label, value, onChange, step, min }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-700 flex-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step ?? 1}
        min={min ?? 0}
        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function AdminSettingsPage() {
  const { showToast } = useToast()
  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings })
  const mutSave = useMutation({ mutationFn: updateSettings, onSuccess: () => showToast('Settings saved', 'success') })

  const [fees, setFees] = useState(null)
  const [timings, setTimings] = useState(null)
  const [trust, setTrust] = useState(null)
  const [notifs, setNotifs] = useState(
    EVENTS.reduce((acc, e) => ({ ...acc, [e]: { sms: true, email: true } }), {})
  )

  if (!settings && !fees) return null

  const f = fees ?? { platform_fee: settings?.platform_fee ?? 15, min_withdrawal: settings?.min_withdrawal ?? 100000 }
  const t = timings ?? {
    seller_confirmation_hours: settings?.seller_confirmation_hours ?? 24,
    auto_release_hours: settings?.auto_release_hours ?? 72,
    otp_expiry_minutes: settings?.otp_expiry_minutes ?? 15,
    dispute_window_hours: settings?.dispute_window_hours ?? 72,
  }
  const tr = trust ?? {
    trusted_seller_min_sales: settings?.trusted_seller_min_sales ?? 10,
    trusted_seller_min_rating: settings?.trusted_seller_min_rating ?? 4.0,
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
      <p className="text-sm text-gray-500 mt-1">Changes apply immediately across the platform</p>

      {/* Fees */}
      <div className="mt-6">
        <SettingGroup title="Fees & Financial" onSave={() => mutSave.mutate(f)} saving={mutSave.isPending}>
          <Field label="Platform Fee (%)" value={f.platform_fee} onChange={(v) => setFees({ ...f, platform_fee: v })} />
          <Field label="Minimum Withdrawal (₦, in kobo)" value={f.min_withdrawal} onChange={(v) => setFees({ ...f, min_withdrawal: v })} />
        </SettingGroup>

        <SettingGroup title="Order Timings" onSave={() => mutSave.mutate(t)} saving={mutSave.isPending}>
          <Field label="Seller Confirmation Window (hours)" value={t.seller_confirmation_hours} onChange={(v) => setTimings({ ...t, seller_confirmation_hours: v })} />
          <Field label="Auto-Release Window (hours)" value={t.auto_release_hours} onChange={(v) => setTimings({ ...t, auto_release_hours: v })} />
          <Field label="OTP Expiry (minutes)" value={t.otp_expiry_minutes} onChange={(v) => setTimings({ ...t, otp_expiry_minutes: v })} />
          <Field label="Dispute Window (hours)" value={t.dispute_window_hours} onChange={(v) => setTimings({ ...t, dispute_window_hours: v })} />
        </SettingGroup>

        <SettingGroup title="Trust & Badges" onSave={() => mutSave.mutate(tr)} saving={mutSave.isPending}>
          <Field label="Min Sales for Trusted Badge" value={tr.trusted_seller_min_sales} onChange={(v) => setTrust({ ...tr, trusted_seller_min_sales: v })} />
          <Field label="Min Rating for Trusted Badge" value={tr.trusted_seller_min_rating} onChange={(v) => setTrust({ ...tr, trusted_seller_min_rating: v })} step={0.1} />
        </SettingGroup>

        <SettingGroup title="Notifications" onSave={() => mutSave.mutate({ notifications: notifs })} saving={mutSave.isPending}>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">Event</span>
            <span className="text-xs font-semibold text-gray-500 uppercase text-center">SMS</span>
            <span className="text-xs font-semibold text-gray-500 uppercase text-center">Email</span>
            {EVENTS.map((event) => (
              <>
                <span key={event} className="text-sm text-gray-700 self-center">{event}</span>
                <div className="flex justify-center">
                  <Toggle
                    checked={notifs[event]?.sms ?? true}
                    onChange={(v) => setNotifs((n) => ({ ...n, [event]: { ...n[event], sms: v } }))}
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={notifs[event]?.email ?? true}
                    onChange={(v) => setNotifs((n) => ({ ...n, [event]: { ...n[event], email: v } }))}
                  />
                </div>
              </>
            ))}
          </div>
        </SettingGroup>
      </div>
    </div>
  )
}
