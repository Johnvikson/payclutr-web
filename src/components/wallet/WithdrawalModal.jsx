import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestWithdrawal } from '../../api/endpoints.js'
import { formatNaira } from '../../utils/formatters.js'
import { NIGERIAN_BANKS } from '../../utils/constants.js'
import LoadingButton from '../ui/LoadingButton.jsx'

export default function WithdrawalModal({ isOpen, onClose, balance }) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  const qc = useQueryClient()

  const amountNaira = parseFloat(amount || 0)
  const amountKobo = Math.round(amountNaira * 100)
  const minNaira = 1000
  const maxNaira = balance / 100
  const amountValid = amountNaira >= minNaira && amountKobo <= balance

  const mutation = useMutation({
    mutationFn: () => requestWithdrawal({
      amount: amountKobo,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] })
      setStep(3)
    },
  })

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(1)
      setAmount('')
      setBankName('')
      setAccountNumber('')
      setAccountName('')
      mutation.reset()
    }, 300)
  }

  if (!isOpen) return null

  const STEP_TITLES = { 1: 'Withdraw Funds', 2: 'Bank Details', 3: 'Request Submitted' }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={step < 3 ? handleClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm z-10 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{STEP_TITLES[step]}</h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">

          {/* Step 1 — Amount */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Available: {formatNaira(balance)}</p>
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-500">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full h-12 pl-9 pr-4 text-lg border border-gray-200 rounded-lg focus:outline-none focus:border-[#E8470A] transition-colors"
                  />
                </div>
                {amount && !amountValid && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {amountNaira < minNaira
                      ? `Minimum withdrawal is ₦${minNaira.toLocaleString()}`
                      : `Cannot exceed your balance of ${formatNaira(balance)}`}
                  </p>
                )}
                {amount && amountValid && (
                  <p className="text-sm text-gray-500 mt-2">You will receive: {formatNaira(amountKobo)}</p>
                )}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!amountValid}
                className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-colors hover:bg-[#c93d09]"
                style={{ backgroundColor: '#E8470A' }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2 — Bank details */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#E8470A] transition-colors"
                >
                  <option value="">Select bank</option>
                  {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0123456789"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8470A] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name as on bank account"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8470A] transition-colors"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-gray-900">{formatNaira(amountKobo)}</span>
                </div>
                {bankName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bank</span>
                    <span className="font-medium text-gray-900">{bankName}</span>
                  </div>
                )}
                {accountNumber.length === 10 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Account</span>
                    <span className="font-medium text-gray-900">****{accountNumber.slice(-4)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <LoadingButton
                  onClick={() => mutation.mutate()}
                  isLoading={mutation.isPending}
                  disabled={!bankName || accountNumber.length !== 10 || !accountName.trim()}
                  className="flex-1 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 hover:bg-[#c93d09] transition-colors"
                  style={{ backgroundColor: '#E8470A' }}
                >
                  Withdraw Now
                </LoadingButton>
              </div>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle size={48} className="text-green-500 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-900">Request Submitted!</p>
                <p className="text-sm text-gray-500 mt-1">Processed within 24 hours</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full mt-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
