import { useState, useEffect, useCallback, ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { getAllDeposits } from '../../services/depositService'
import { getAllPurchases } from '../../services/purchaseService'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingDeposits, setPendingDeposits] = useState(0)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)

  const loadCounts = useCallback(async () => {
    try {
      const [deps, purchases] = await Promise.all([getAllDeposits(), getAllPurchases()])
      setPendingDeposits(deps.filter(d => d.type === 'deposit' && d.status === 'pending').length)
      setPendingWithdrawals(deps.filter(d => d.type === 'withdraw' && d.status === 'pending').length)
      setPendingOrders(purchases.filter(p => p.status === 'pending').length)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadCounts() }, [loadCounts])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0720' }}>
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingDeposits={pendingDeposits}
        pendingWithdrawals={pendingWithdrawals}
        pendingOrders={pendingOrders}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: '#110b2d' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
