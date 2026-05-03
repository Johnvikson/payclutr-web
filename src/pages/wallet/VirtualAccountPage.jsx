import { createElement, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, Building2, CheckCircle2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { getDepositAccount, setupDepositAccount } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { Field, TextInput } from '../../components/ui/Field.jsx'

export default function VirtualAccountPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [bvn, setBvn] = useState('')
  const [bvnError, setBvnError] = useState('')
  const [pending, setPending] = useState(false)
  const accountOwnerName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()

  const { data: account, isLoading } = useQuery({
    queryKey: ['deposit-account'],
    queryFn: getDepositAccount,
  })

  const mutation = useMutation({
    mutationFn: setupDepositAccount,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['deposit-account'] })
      if (data?.account_number) {
        showToast('Virtual account created. You can now top up your wallet.', 'success')
        navigate('/wallet')
        return
      }
      setPending(true)
      showToast('BVN submitted. Your virtual account will be ready shortly.', 'success')
    },
    onError: (err) => {
      const msg =
        err?.detail ??
        err?.response?.data?.detail ??
        err?.message ??
        'Virtual account setup failed. Please try again.'
      showToast(msg, 'error')
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (bvn.length !== 11) {
      setBvnError('BVN must be exactly 11 digits')
      return
    }
    setBvnError('')
    mutation.mutate({ bvn })
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)] px-4 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto h-80 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)]">
      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto">
        <Link
          to="/wallet"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={16} /> Wallet
        </Link>

        <div className="mt-5 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="relative p-6 bg-zinc-950 text-white">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  <BadgeCheck size={13} /> Verified and handled by Paystack
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight">Create Virtual Account</h1>
                <p className="mt-2 text-sm text-zinc-300 max-w-lg">
                  Enter your BVN to create a dedicated PayClutr funding account for secure wallet top ups.
                </p>
              </div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand">
                <Building2 size={24} />
              </div>
            </div>
          </div>

          {account?.account_number ? (
            <div className="p-6">
              <Badge tone="verified">Virtual account active</Badge>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard label="Bank" value={account.bank_name} />
                <InfoCard label="Account" value={account.account_number} mono />
                <InfoCard label="Name" value={account.account_name} />
              </div>
              <Button className="mt-5" onClick={() => navigate('/wallet')}>Back to wallet</Button>
            </div>
          ) : pending ? (
            <div className="p-6 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-brand shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Creating your virtual account</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                  Paystack is verifying the BVN. Your account details will appear in Wallet once ready.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TrustItem icon={ShieldCheck} title="Paystack verified" body="BVN verification is processed securely." />
                <TrustItem icon={Lock} title="Bank-grade handling" body="PayClutr never sees your bank credentials." />
              </div>

              <div>
                <Field
                  label="BVN"
                  error={bvnError}
                  hint={`Your bank account name should match ${accountOwnerName || 'your PayClutr name'}.`}
                >
                  <TextInput
                    type="text"
                    inputMode="numeric"
                    value={bvn}
                    onChange={(e) => {
                      setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))
                      setBvnError('')
                    }}
                    placeholder="Enter 11-digit BVN"
                    error={!!bvnError}
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
                  This BVN is used only to create and verify your dedicated virtual account through Paystack.
                </p>
              </div>

              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? 'Creating virtual account...' : 'Create virtual account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, mono }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-3 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function TrustItem({ icon: Icon, title, body }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
        {createElement(Icon, { size: 16, className: 'text-brand' })} {title}
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{body}</p>
    </div>
  )
}
