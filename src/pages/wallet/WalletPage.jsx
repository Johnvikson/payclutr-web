import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, ArrowDownLeft, ArrowUpRight, Building2, Copy, CheckCircle2 } from 'lucide-react'
import { getWallet, getDepositAccount, setupDepositAccount } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { formatNaira, formatDate } from '../../utils/formatters.js'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import WithdrawalModal from '../../components/wallet/WithdrawalModal.jsx'

const TABS = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'withdrawals',  label: 'Withdrawals' },
]

function TransactionRow({ tx }) {
  const isCredit = tx.type === 'credit'
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
        {isCredit
          ? <ArrowDownLeft size={15} className="text-green-600" />
          : <ArrowUpRight size={15} className="text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-1">{tx.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">Ref: {tx.reference} · {formatDate(tx.created_at)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
          {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
        </p>
        <StatusBadge status={tx.status} className="mt-0.5 text-[10px]" />
      </div>
    </div>
  )
}

function WithdrawalRow({ w }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <Building2 size={15} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{w.bank_name}</p>
        <p className="text-xs text-gray-400">****{w.account_number?.slice(-4)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(w.created_at)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">{formatNaira(w.amount)}</p>
        <StatusBadge status={w.status} className="mt-0.5 text-[10px]" />
      </div>
    </div>
  )
}

function DepositAccountCard() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [bvn, setBvn] = useState('')
  const [bvnError, setBvnError] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: account, isLoading } = useQuery({
    queryKey: ['deposit-account'],
    queryFn: getDepositAccount,
  })

  const [pending, setPending] = useState(false)

  const mutation = useMutation({
    mutationFn: setupDepositAccount,
    onSuccess: () => {
      setPending(true)
      showToast('BVN submitted. Your deposit account will be ready shortly.', 'success')
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail ?? 'Setup failed. Please try again.'
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

  if (pending) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deposit Account</p>
        <div className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
            <svg className="animate-spin h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Verifying your BVN…</p>
            <p className="text-xs text-gray-400 mt-0.5">Your deposit account will appear here once verified. This usually takes a few minutes.</p>
          </div>
        </div>
      </div>
    )
  }

  if (account?.account_number) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Deposit Account</p>
        <p className="text-xs text-gray-400 mb-4">Transfer from your personal bank account to fund your wallet. Only transfers matching your registered name will be accepted.</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500">Bank</span>
            <span className="text-sm font-semibold text-gray-900">{account.bank_name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500">Account Number</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 tracking-wide">{account.account_number}</span>
              <button onClick={() => handleCopy(account.account_number)} className="text-gray-400 hover:text-brand-500 transition-colors">
                {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-500">Account Name</span>
            <span className="text-sm font-medium text-gray-900">{account.account_name}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fund Your Wallet</p>
      <p className="text-xs text-gray-400 mb-4">
        Enter your BVN to create a dedicated deposit account. Only transfers from your personal bank account matching your name will be accepted.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={bvn}
            onChange={(e) => { setBvn(e.target.value.replace(/\D/g, '').slice(0, 11)); setBvnError('') }}
            placeholder="Enter 11-digit BVN"
            className={`input-field text-sm ${bvnError ? 'input-error' : ''}`}
          />
          {bvnError && <p className="form-error mt-1">{bvnError}</p>}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary px-4 py-2 text-sm shrink-0"
        >
          {mutation.isPending ? 'Verifying…' : 'Verify BVN'}
        </button>
      </form>
    </div>
  )
}

export default function WalletPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('transactions')
  const [showWithdraw, setShowWithdraw] = useState(false)

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  })

  const balance = wallet?.balance ?? user?.wallet_balance ?? 0
  const canWithdraw = balance > 0 && user?.kyc_status === 'verified'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Balance card */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white">
              {isLoading ? '—' : formatNaira(balance)}
            </p>
          </div>
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-gray-400" />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">PayClutr Wallet</p>
            <p className="text-sm text-gray-300 font-medium mt-0.5">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
          {canWithdraw ? (
            <button
              onClick={() => setShowWithdraw(true)}
              className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              Withdraw
            </button>
          ) : (
            <div className="text-right">
              <p className="text-xs text-gray-500">Verify identity to withdraw</p>
              <Link to="/kyc" className="text-xs text-brand-400 underline">Verify Now</Link>
            </div>
          )}
        </div>
      </div>

      {/* Deposit account */}
      <DepositAccountCard />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative pb-3 px-1 mr-5 text-sm font-medium transition-colors ${
              activeTab === key ? 'text-brand-600' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {label}
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-gray-100 px-4">
          {!wallet?.transactions?.length ? (
            <div className="py-16 text-center">
              <Wallet size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1">Your wallet activity will appear here</p>
            </div>
          ) : (
            wallet.transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-xl border border-gray-100 px-4">
          {!wallet?.withdrawals?.length ? (
            <div className="py-16 text-center">
              <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No withdrawal requests yet</p>
              <p className="text-xs text-gray-400 mt-1">Your withdrawal history will appear here</p>
            </div>
          ) : (
            wallet.withdrawals.map((w) => <WithdrawalRow key={w.id} w={w} />)
          )}
        </div>
      )}

      <WithdrawalModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
      />
    </div>
  )
}
