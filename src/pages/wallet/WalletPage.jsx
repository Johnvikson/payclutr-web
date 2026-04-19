import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Wallet, ArrowDownLeft, ArrowUpRight, Building2 } from 'lucide-react'
import { getWallet } from '../../api/endpoints.js'
import { useAuth } from '../../hooks/useAuth.js'
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
              <Link to="/kyc" className="text-xs text-brand-400 underline">
                Verify Now
              </Link>
            </div>
          )}
        </div>
      </div>

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
