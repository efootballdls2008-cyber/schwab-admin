import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../components/layout/AdminLayout'
import { get, post, patch, del } from '../api/client'
import { API } from '../api/endpoints'
import type { PlatformAccount, PaymentMethod, AssignedTo } from '../types'

// ── Real API service functions ────────────────────────────────
const getAllPlatformAccounts = (): Promise<PlatformAccount[]> =>
  get<PlatformAccount[]>(API.platformAccounts)

const toggleAccountStatus = (account: PlatformAccount): Promise<PlatformAccount> =>
  patch<PlatformAccount>(API.platformAccount(account.id), {
    status: account.status === 'active' ? 'inactive' : 'active',
  })

const setDefaultForRole = (id: number, assignedTo: AssignedTo): Promise<PlatformAccount> =>
  patch<PlatformAccount>(API.platformAccount(id), { assignedTo, isDefault: true })

const saveAccount = (data: Partial<PlatformAccount> & { id?: number }): Promise<PlatformAccount> =>
  data.id
    ? patch<PlatformAccount>(API.platformAccount(data.id), data)
    : post<PlatformAccount>(API.platformAccounts, data)

const deleteAccount = (id: number): Promise<void> =>
  del<void>(API.platformAccount(id))

// ── Role labels & colours ─────────────────────────────────────
const ROLE_LABELS: Record<AssignedTo, string> = {
  deposit:   'Deposits',
  buy_crypto: 'Buy Crypto',
  buy_stock:  'Buy Stocks',
  all:        'All Operations',
}

const ROLE_COLORS: Record<AssignedTo, { bg: string; text: string; border: string }> = {
  deposit:    { bg: 'rgba(74,222,128,0.12)',  text: '#4ade80',  border: 'rgba(74,222,128,0.3)'  },
  buy_crypto: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b',  border: 'rgba(245,158,11,0.3)'  },
  buy_stock:  { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa',  border: 'rgba(96,165,250,0.3)'  },
  all:        { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa',  border: 'rgba(167,139,250,0.3)' },
}

// ── Set-Default dropdown ──────────────────────────────────────
function SetDefaultMenu({
  account,
  onSet,
}: {
  account: PlatformAccount
  onSet: (role: AssignedTo) => void
}) {
  const [open, setOpen] = useState(false)
  const roles: AssignedTo[] = ['deposit', 'buy_crypto', 'buy_stock', 'all']

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
        style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
        title="Set as default for role"
      >
        <i className="fas fa-star text-xs" />
        <i className="fas fa-chevron-down text-[9px]" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl min-w-[170px]"
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                Set default for
              </p>
              {roles.map(role => {
                const c = ROLE_COLORS[role]
                const isCurrent = account.assignedTo === role && account.isDefault
                return (
                  <button
                    key={role}
                    onClick={() => { onSet(role); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ color: isCurrent ? c.text : '#9ca3af' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: c.text }}
                    />
                    {ROLE_LABELS[role]}
                    {isCurrent && <i className="fas fa-check ml-auto text-[10px]" style={{ color: c.text }} />}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Add / Edit modal ──────────────────────────────────────────
function PlatformAccountModal({
  account,
  onClose,
  onSave,
}: {
  account: PlatformAccount | null
  onClose: () => void
  onSave: (account: PlatformAccount) => void
}) {
  const [formData, setFormData] = useState<Partial<PlatformAccount>>(
    account || {
      accountName: '',
      paymentMethod: 'bank_transfer',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountType: 'Checking',
      swiftCode: '',
      bankAddress: '',
      myAddress: '',
      walletAddress: '',
      network: '',
      isDefault: false,
      assignedTo: 'deposit',
      status: 'active',
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as PlatformAccount)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(145deg, #130d35, #1a1040)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)' }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">
              {account ? 'Edit Account' : 'Add New Account'}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: '#6b7280' }}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Name + Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Account Name</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                  style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                  style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="wire_transfer">Wire Transfer</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>
            </div>

            {/* Bank fields vs Crypto fields */}
            {formData.paymentMethod !== 'crypto' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                      style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Account Type</label>
                    <select
                      value={formData.accountType}
                      onChange={e => setFormData({ ...formData, accountType: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                      style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <option value="Checking">Checking</option>
                      <option value="Savings">Savings</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                      style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Routing Number</label>
                    <input
                      type="text"
                      value={formData.routingNumber}
                      onChange={e => setFormData({ ...formData, routingNumber: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                      style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">SWIFT / BIC Code</label>
                    <input
                      type="text"
                      value={formData.swiftCode}
                      onChange={e => setFormData({ ...formData, swiftCode: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                      style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Bank Address</label>
                    <input
                      type="text"
                      value={formData.bankAddress}
                      onChange={e => setFormData({ ...formData, bankAddress: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                      style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={formData.walletAddress}
                    onChange={e => setFormData({ ...formData, walletAddress: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                    style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Network</label>
                  <input
                    type="text"
                    value={formData.network}
                    onChange={e => setFormData({ ...formData, network: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm text-gray-300 rounded-xl outline-none"
                    style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    placeholder="e.g., Bitcoin, Ethereum"
                  />
                </div>
              </div>
            )}

            {/* Assigned To */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Assigned To</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(ROLE_LABELS) as [AssignedTo, string][]).map(([role, label]) => {
                  const c = ROLE_COLORS[role]
                  const active = formData.assignedTo === role
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedTo: role })}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: active ? c.bg : 'rgba(255,255,255,0.03)',
                        color: active ? c.text : '#6b7280',
                        border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.text }} />
                      {label}
                      {active && <i className="fas fa-check ml-auto text-[10px]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Set as default */}
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault ?? false}
                  onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Set as default for selected role</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#fff' }}
              >
                {account ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function PlatformAccounts() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editingAccount, setEditingAccount] = useState<PlatformAccount | null>(null)
  const [showModal, setShowModal] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await getAllPlatformAccounts())
    } catch {
      showToast('Failed to load platform accounts', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggleStatus = async (account: PlatformAccount) => {
    try {
      await toggleAccountStatus(account)
      showToast(`Account ${account.status === 'active' ? 'deactivated' : 'activated'}.`, 'success')
      await load()
    } catch {
      showToast('Failed to update account status', 'error')
    }
  }

  const handleSetDefaultForRole = async (account: PlatformAccount, role: AssignedTo) => {
    try {
      await setDefaultForRole(account.id, role)
      showToast(`"${account.accountName}" set as default for ${ROLE_LABELS[role]}.`, 'success')
      await load()
    } catch {
      showToast('Failed to set default account', 'error')
    }
  }

  const handleDeleteAccount = async (account: PlatformAccount) => {
    if (!window.confirm(`Delete "${account.accountName}"? This cannot be undone.`)) return
    try {
      await deleteAccount(account.id)
      showToast('Account deleted.', 'success')
      await load()
    } catch {
      showToast('Failed to delete account', 'error')
    }
  }

  const handleSaveAccount = async (accountData: PlatformAccount) => {
    try {
      await saveAccount(accountData)
      showToast(`Account ${editingAccount ? 'updated' : 'created'} successfully.`, 'success')
      setShowModal(false)
      setEditingAccount(null)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save account', 'error')
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer': return 'fa-university'
      case 'credit_card':   return 'fa-credit-card'
      case 'wire_transfer': return 'fa-exchange-alt'
      case 'crypto':        return 'fa-bitcoin'
      default:              return 'fa-wallet'
    }
  }

  // Derived: which role each account is the current default for
  const defaultByRole = (role: AssignedTo) =>
    accounts.find(a => a.isDefault && (a.assignedTo === role || a.assignedTo === 'all'))

  const ROLE_STATS: { role: AssignedTo; label: string; color: string }[] = [
    { role: 'deposit',    label: 'Deposit Default',    color: '#4ade80' },
    { role: 'buy_crypto', label: 'Crypto Default',     color: '#f59e0b' },
    { role: 'buy_stock',  label: 'Stock Default',      color: '#60a5fa' },
    { role: 'all',        label: 'General Default',    color: '#a78bfa' },
  ]

  return (
    <AdminLayout title="Platform Accounts" subtitle="Manage payment accounts and wallets">
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            style={{
              background: toast.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
              color: toast.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            }}
          >
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`} />
            {toast.msg}
          </motion.div>
        )}
        {showModal && (
          <PlatformAccountModal
            account={editingAccount}
            onClose={() => { setShowModal(false); setEditingAccount(null) }}
            onSave={handleSaveAccount}
          />
        )}
      </AnimatePresence>

      <div className="space-y-5">

        {/* ── 4 Role-Default cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLE_STATS.map(({ role, label, color }) => {
            const def = defaultByRole(role)
            return (
              <div
                key={role}
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(22,15,53,0.9)', border: `1px solid ${def ? ROLE_COLORS[role].border : 'rgba(255,255,255,0.07)'}` }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                    {label}
                  </p>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: def ? color : '#374151' }}
                  />
                </div>
                {def ? (
                  <>
                    <p className="text-xs font-bold text-white truncate">{def.accountName}</p>
                    <p className="text-[10px]" style={{ color: '#6b7280' }}>
                      {def.paymentMethod === 'crypto' ? def.network : def.bankName}
                    </p>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: '#4b5563' }}>Not assigned</p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Accounts', value: accounts.length,                                          color: '#60a5fa' },
            { label: 'Active',         value: accounts.filter(a => a.status === 'active').length,       color: '#4ade80' },
            { label: 'Defaults Set',   value: accounts.filter(a => a.isDefault).length,                 color: '#c9a84c' },
            { label: 'Crypto Wallets', value: accounts.filter(a => a.paymentMethod === 'crypto').length, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Add button ── */}
        <div className="flex justify-end">
          <button
            onClick={() => { setEditingAccount(null); setShowModal(true) }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#fff' }}
          >
            <i className="fas fa-plus mr-2" />
            Add Account
          </button>
        </div>

        {/* ── Accounts table ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ background: '#1a1040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Account', 'Payment Method', 'Details', 'Assigned To', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-500">
                      <i className="fas fa-spinner fa-spin mr-2" />Loading…
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-500">
                      No platform accounts found.
                    </td>
                  </tr>
                ) : accounts.map((account, i) => {
                  const isActive = account.status === 'active'
                  const rc = ROLE_COLORS[account.assignedTo] ?? ROLE_COLORS['all']
                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                      }}
                    >
                      {/* Account name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                            <i className={`fas ${getPaymentMethodIcon(account.paymentMethod)}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-white">{account.accountName}</p>
                              {account.isDefault && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}>
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: '#6b7280' }}>#{account.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Payment method */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg capitalize" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                          {(account.paymentMethod ?? '').replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs text-gray-300">
                          {account.paymentMethod === 'crypto' ? (
                            <>
                              <p className="font-mono">{account.walletAddress?.slice(0, 20)}…</p>
                              <p style={{ color: '#6b7280' }}>{account.network}</p>
                            </>
                          ) : (
                            <>
                              <p>{account.bankName}</p>
                              <p style={{ color: '#6b7280' }}>****{account.accountNumber?.slice(-4)}</p>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
                        >
                          {ROLE_LABELS[account.assignedTo] ?? account.assignedTo}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: isActive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: isActive ? '#4ade80' : '#f87171' }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => { setEditingAccount(account); setShowModal(true) }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
                            title="Edit"
                          >
                            <i className="fas fa-edit text-xs" />
                          </button>

                          {/* Set default for role (dropdown) */}
                          <SetDefaultMenu
                            account={account}
                            onSet={role => handleSetDefaultForRole(account, role)}
                          />

                          {/* Toggle active/inactive */}
                          <button
                            onClick={() => handleToggleStatus(account)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                              background: isActive ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                              color: isActive ? '#f87171' : '#4ade80',
                              border: `1px solid ${isActive ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)'}`,
                            }}
                            title={isActive ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`fas ${isActive ? 'fa-pause' : 'fa-play'} text-xs`} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteAccount(account)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                            title="Delete"
                          >
                            <i className="fas fa-trash text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1040' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Showing <span className="text-white font-medium">{accounts.length}</span> platform accounts
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
