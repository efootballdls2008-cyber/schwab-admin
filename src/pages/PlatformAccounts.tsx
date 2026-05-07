import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../components/layout/AdminLayout'
import { getPlatformAccounts, createPlatformAccount, updatePlatformAccount, deletePlatformAccount } from '../services/platformService'
import type { PlatformAccount } from '../types'

type FormData = Omit<PlatformAccount, 'id'>

const EMPTY_FORM: FormData = { accountName: '', bankName: '', accountNumber: '', routingNumber: '', accountType: 'Business Checking', swiftCode: '', isDefault: false, status: 'active' }

export default function PlatformAccounts() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PlatformAccount | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlatformAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try { setAccounts(await getPlatformAccounts()) }
    catch { showToast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }
  function openEdit(a: PlatformAccount) {
    setEditing(a)
    setForm({ accountName: a.accountName, bankName: a.bankName, accountNumber: a.accountNumber, routingNumber: a.routingNumber, accountType: a.accountType, swiftCode: a.swiftCode, isDefault: a.isDefault, status: a.status })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) { await updatePlatformAccount(editing.id, form); showToast('Account updated', 'success') }
      else { await createPlatformAccount(form); showToast('Account created', 'success') }
      setShowForm(false)
      await load()
    } catch { showToast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePlatformAccount(deleteTarget.id)
      showToast('Account deleted', 'success')
      setDeleteTarget(null)
      await load()
    } catch { showToast('Failed to delete', 'error') }
    finally { setDeleting(false) }
  }

  async function handleSetDefault(a: PlatformAccount) {
    try {
      await Promise.all(accounts.map(acc => updatePlatformAccount(acc.id, { isDefault: acc.id === a.id })))
      showToast(`${a.accountName} set as default`, 'success')
      await load()
    } catch { showToast('Failed', 'error') }
  }

  return (
    <AdminLayout title="Platform Accounts" subtitle="Bank accounts where users deposit funds">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            style={{ background: toast.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: toast.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}` }}
          >
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`} />{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !deleting && setDeleteTarget(null)}
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'linear-gradient(145deg, #130d35, #1a1040)', border: '1px solid rgba(248,113,113,0.25)' }}
            >
              <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #f87171, transparent)' }} />
              <div className="px-6 pt-6 pb-5 space-y-4">
                {/* Icon + title */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <i className="fas fa-trash text-base" style={{ color: '#f87171' }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Delete Account</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>This action cannot be undone</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

                {/* Account preview */}
                <div className="rounded-xl p-4 space-y-1.5" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)' }}>
                  <p className="text-sm font-semibold text-white">{deleteTarget.accountName}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{deleteTarget.bankName}</p>
                  <p className="text-xs font-mono mt-1" style={{ color: '#6b7280' }}>
                    Acct: {deleteTarget.accountNumber}&nbsp;·&nbsp;Routing: {deleteTarget.routingNumber}
                  </p>
                </div>

                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Are you sure you want to delete this platform account? Users will no longer see it for deposits.
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)', color: '#fff' }}
                  >
                    {deleting
                      ? <span><i className="fas fa-spinner fa-spin mr-2" />Deleting…</span>
                      : <span><i className="fas fa-trash mr-2" />Delete Account</span>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'linear-gradient(145deg, #130d35, #1a1040)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <h2 className="text-base font-bold text-white">{editing ? 'Edit Account' : 'Add Platform Account'}</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10" style={{ color: '#6b7280' }}>
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
              <div className="px-6 py-5 space-y-3">
                {[
                  { key: 'accountName',  label: 'Account Name',   placeholder: 'Charles Schwab Trading LLC - Main' },
                  { key: 'bankName',     label: 'Bank Name',      placeholder: 'JPMorgan Chase' },
                  { key: 'accountNumber',label: 'Account Number', placeholder: '1234567890' },
                  { key: 'routingNumber',label: 'Routing Number', placeholder: '021000021' },
                  { key: 'accountType',  label: 'Account Type',   placeholder: 'Business Checking' },
                  { key: 'swiftCode',    label: 'SWIFT Code',     placeholder: 'CHASUS33' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>{f.label}</label>
                    <input
                      type="text"
                      value={(form as Record<string, unknown>)[f.key] as string}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded accent-yellow-500" />
                  <span className="text-xs text-gray-300">Set as default account</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#a28539,#c9a84c)', color: '#0d0824' }}>
                    {saving ? <i className="fas fa-spinner fa-spin" /> : editing ? 'Save Changes' : 'Add Account'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#6b7280' }}>These accounts are shown to users when they request a deposit.</p>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg,#a28539,#c9a84c)', color: '#0d0824' }}>
            <i className="fas fa-plus text-xs" />Add Account
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500"><i className="fas fa-spinner fa-spin mr-2" />Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <i className="fas fa-university text-3xl mb-3" style={{ color: '#374151' }} />
            <p className="text-sm text-gray-500">No platform accounts yet.</p>
            <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg,#a28539,#c9a84c)', color: '#0d0824' }}>Add First Account</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.map(a => (
              <div key={a.id} className="rounded-2xl p-5" style={{ background: 'rgba(22,15,53,0.9)', border: `1px solid ${a.isDefault ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
                      <i className="fas fa-university text-sm" style={{ color: '#c9a84c' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{a.accountName}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{a.bankName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.isDefault && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}>Default</span>}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: a.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: a.status === 'active' ? '#4ade80' : '#f87171' }}>{a.status}</span>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {[['Account No.', a.accountNumber], ['Routing No.', a.routingNumber], ['Type', a.accountType], ['SWIFT', a.swiftCode || '—']].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>{l}</span>
                      <span className="text-xs font-mono text-white">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => openEdit(a)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(a)} className="py-1.5 px-3 rounded-lg text-xs font-semibold" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <i className="fas fa-trash text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
