import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownLeft, ArrowUpRight, Copy, CheckCircle2, Plus, Wallet as WalletIcon, Lock, UserCog,
} from 'lucide-react'
import { getWallet, getDepositAccount, setupDepositAccount } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { formatNaira, formatDate } from '../../utils/formatters.js'
import Logo from '../../components/ui/Logo.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { Field, TextInput } from '../../components/ui/Field.jsx'
import WithdrawalModal from '../../components/wallet/WithdrawalModal.jsx'
import EditProfileModal from '../../components/profile/EditProfileModal.jsx'

const BASE_TABS = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'withdrawals',  label: 'Withdrawals' },
]

// ─── Deposit account block (3 states: empty / pending / active) ─────────────
function DepositAccount({ showSetup, onStartSetup }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [bvn, setBvn] = useState('')
  const [bvnError, setBvnError] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(false)
  const accountOwnerName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()

  const { data: account, isLoading } = useQuery({
    queryKey: ['deposit-account'],
    queryFn: getDepositAccount,
  })

  const mutation = useMutation({
    mutationFn: setupDepositAccount,
    onSuccess: (data) => {
      // Backend returns the account synchronously (account_number + bank_name + account_name).
      // Refetch the deposit-account query so the UI swaps to the active state.
      if (data?.account_number) {
        showToast('Deposit account created — you can now fund your wallet.', 'success')
      } else {
        // Fallback: backend returned 202 (async webhook flow)
        setPending(true)
        showToast('BVN submitted. Your deposit account will be ready shortly.', 'success')
      }
      qc.invalidateQueries({ queryKey: ['deposit-account'] })
    },
    onError: (err) => {
      // client.js interceptor flattens { detail } onto the rejected value.
      const msg =
        err?.detail ??
        err?.response?.data?.detail ??
        err?.message ??
        'Setup failed. Please try again.'
      showToast(msg, 'error')
    },
  })

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!bvn || bvn.length !== 11) {
      setBvnError('BVN must be exactly 11 digits')
      return
    }
    setBvnError('')
    mutation.mutate({ bvn })
  }

  if (isLoading) return null

  // ── Active account ─────────────────────────────────────────────────────
  if (account?.account_number) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-zinc-500">Your dedicated funding account</div>
            <div className="text-base font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">
              Send money to top up instantly
            </div>
          </div>
          <Badge tone="verified">Active</Badge>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500">Bank</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 truncate">
              {account.bank_name}
            </div>
          </div>
          <div className="p-3 pr-9 rounded-lg bg-gray-50 dark:bg-zinc-800/50 relative min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500">Account</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 font-mono truncate">
              {account.account_number}
            </div>
            <button
              onClick={() => handleCopy(account.account_number)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              aria-label="Copy account number"
            >
              {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-500">Name</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 truncate">
              {account.account_name}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-gray-500 dark:text-zinc-500">
          Only transfers from a bank account matching {accountOwnerName || 'your PayClutr name'} should be used.
        </p>
      </div>
    )
  }

  // ── Pending verification ───────────────────────────────────────────────
  if (pending) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
            <svg className="animate-spin h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">Verifying your BVN…</div>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
              Your deposit account will appear here once verified. This usually takes a few minutes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Empty state — BVN entry form ──────────────────────────────────────
  if (!showSetup) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">
              Fund Your Wallet
            </div>
            <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
              Create a dedicated virtual account when you are ready to top up.
            </p>
          </div>
          <Button type="button" onClick={onStartSetup} icon={Plus} className="shrink-0">
            Create Account
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5">
      <div className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">
        Fund Your Wallet
      </div>
      <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
        Enter your BVN to create a dedicated deposit account.
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
        Only transfers from your personal bank account matching your name will be accepted.
        Your bank account name should match {accountOwnerName || 'your PayClutr name'}.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Field error={bvnError}>
            <TextInput
              type="text"
              inputMode="numeric"
              value={bvn}
              onChange={(e) => { setBvn(e.target.value.replace(/\D/g, '').slice(0, 11)); setBvnError('') }}
              placeholder="Enter 11-digit BVN"
              error={bvnError}
            />
          </Field>
        </div>
        <Button type="submit" disabled={mutation.isPending} className="shrink-0">
          {mutation.isPending ? 'Verifying…' : 'Verify BVN'}
        </Button>
      </form>

      <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-500 dark:text-zinc-500">
        <Lock size={12} className="shrink-0 mt-0.5" />
        <span>Your BVN is verified by Paystack. PayClutr never sees or stores your bank credentials.</span>
      </div>
    </div>
  )
}

// ─── Transaction row ────────────────────────────────────────────────────────
function TransactionRow({ tx }) {
  const isCredit = tx.type === 'credit'
  return (
    <div className="p-4 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isCredit
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}
      >
        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
          {tx.description}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-zinc-500 font-mono mt-0.5 truncate">
          {tx.reference} · {formatDate(tx.created_at)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className={`text-sm font-semibold ${
            isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-zinc-100'
          }`}
        >
          {isCredit ? '+' : '−'}{formatNaira(tx.amount)}
        </div>
        <div className="mt-1">
          <Badge
            tone={tx.status === 'completed' ? 'verified' : tx.status === 'failed' ? 'rejected' : 'pending'}
            size="xs"
          >
            {tx.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function WithdrawalRow({ w }) {
  return (
    <div className="p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-gray-500 dark:text-zinc-400">
        <ArrowUpRight size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
          {w.bank_name} · ****{w.account_number?.slice(-4)}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5">
          {formatDate(w.created_at)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          {formatNaira(w.amount)}
        </div>
        <div className="mt-1">
          <Badge
            tone={w.status === 'processed' ? 'verified' : w.status === 'rejected' ? 'rejected' : 'pending'}
            size="xs"
          >
            {w.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('transactions')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)

  // Scroll the deposit-account card into view without polluting the URL with a #hash
  // (the hash + scroll-mt would re-snap mobile scroll position when scrolling upward).
  const scrollToDeposit = () => {
    navigate('/wallet/virtual-account')
  }

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  })

  const balance      = wallet?.balance ?? user?.wallet_balance ?? 0
  const salesBalance = wallet?.sales_balance ?? user?.sales_balance ?? 0
  const depositBalance = wallet?.deposit_balance ?? Math.max(balance - salesBalance, 0)
  const isSeller     = user?.role === 'seller'
  const canWithdraw  = isSeller && salesBalance > 0 && user?.kyc_status === 'verified'
  const transactions = wallet?.transactions || []
  const withdrawals  = wallet?.withdrawals  || []
  const tabs = isSeller ? BASE_TABS : BASE_TABS.filter((tab) => tab.key !== 'withdrawals')
  const visibleTab = isSeller ? activeTab : 'transactions'

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-3.5rem)]">
      <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Wallet</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
          Hold funds, fund purchases, withdraw to your bank.
        </p>

        {/* ── Balance card ──────────────────────────────────────────────── */}
        <div className="mt-6 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-brand opacity-20 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="relative min-w-0 pr-10">
              <div className="text-xs text-zinc-400 uppercase tracking-wider">Total balance</div>
              <div className="text-3xl sm:text-4xl font-bold mt-1.5 tracking-tight">
                {isLoading ? '—' : formatNaira(balance)}
              </div>
              <div className="text-xs text-zinc-400 mt-2 truncate">
                {user?.first_name} {user?.last_name}
                {(user?.username || user?.email) && (
                  <> · @{user.username || user.email.split('@')[0]}</>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                aria-label="Edit profile"
                title="Edit profile"
                className="absolute bottom-0 right-0 group inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)] transition-all hover:border-cyan-200/70 hover:bg-cyan-300/20 hover:text-white hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300/20 via-transparent to-brand/30 opacity-70" />
                <UserCog size={14} className="relative" />
              </button>
            </div>
            <Logo size="sm" mono markOnly />
          </div>

          {isSeller && (
            <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BalanceBreakdownCard
                label="Deposit Balance"
                value={depositBalance}
                body="Top-ups and transfers. Purchase-only, not withdrawable."
              />
              <BalanceBreakdownCard
                label="Sales Balance"
                value={salesBalance}
                body="Earnings from sold products. Withdrawable by sellers."
              />
            </div>
          )}

          <div className="relative mt-5 flex flex-wrap gap-2">
            {isSeller && (
              canWithdraw ? (
                <Button onClick={() => setShowWithdraw(true)} icon={ArrowUpRight}>
                  Withdraw
                </Button>
              ) : user?.kyc_status === 'verified' ? (
                <Button disabled icon={ArrowUpRight}>Withdraw</Button>
              ) : (
                <Link to="/kyc">
                  <Button>Verify identity to withdraw</Button>
                </Link>
              )
            )}
            <button
              type="button"
              onClick={scrollToDeposit}
              className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/15 transition-colors"
            >
              <Plus size={16} /> Top up
            </button>
          </div>
        </div>

        {/* ── Deposit account ─────────────────────────────────────────────── */}
        <div id="deposit-account" className="mt-5">
          <DepositAccount showSetup={false} onStartSetup={scrollToDeposit} />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 border-b border-gray-200 dark:border-zinc-800 flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                visibleTab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── List ────────────────────────────────────────────────────────── */}
        <div className="mt-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800 overflow-hidden">
          {visibleTab === 'transactions' ? (
            transactions.length === 0 ? (
              <EmptyList
                title="No transactions yet"
                body="Wallet activity will appear here as you fund and spend."
              />
            ) : (
              transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            )
          ) : withdrawals.length === 0 ? (
            <EmptyList
              title="No withdrawals yet"
              body="Your withdrawal history will appear here."
            />
          ) : (
            withdrawals.map((w) => <WithdrawalRow key={w.id} w={w} />)
          )}
        </div>
      </div>

      <WithdrawalModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={salesBalance}
        user={user}
      />
      {showEditProfile && user && (
        <EditProfileModal profile={user} onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  )
}

function EmptyList({ title, body }) {
  return (
    <div className="py-14 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 mx-auto mb-3">
        <WalletIcon size={22} />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</p>
      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 max-w-xs mx-auto">{body}</p>
    </div>
  )
}

function BalanceBreakdownCard({ label, value, body }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{formatNaira(value)}</div>
      <p className="mt-1 text-[11px] leading-snug text-zinc-400">{body}</p>
    </div>
  )
}
