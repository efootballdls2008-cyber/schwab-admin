import { useState, useEffect } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { get, patch, del } from '../api/client'

interface SupportTicket {
  id: number
  ticketRef: string
  userId: number | null
  userEmail: string
  userFullName: string
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  resolvedByName: string | null
}

interface Stats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  closed: number
  urgent: number
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Edit states
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchTickets()
    fetchStats()
  }, [statusFilter, priorityFilter, searchTerm])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const data = await get<{ success: boolean; tickets: SupportTicket[] }>(
        `/support/admin?${params.toString()}`
      )
      setTickets(data.tickets)
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await get<{ success: boolean; stats: Stats }>('/support/admin/stats/overview')
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const openDetailModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setAdminNotes(ticket.adminNotes || '')
    setEditingStatus(false)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedTicket(null)
    setEditingStatus(false)
  }

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return

    try {
      await patch(`/support/admin/${selectedTicket.id}/status`, {
        status: newStatus,
        adminNotes
      })
      alert('Ticket updated successfully')
      setEditingStatus(false)
      fetchTickets()
      fetchStats()
      closeDetailModal()
    } catch (err) {
      alert('Failed to update ticket')
      console.error(err)
    }
  }

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return
    }

    try {
      await del(`/support/admin/${id}`)
      alert('Ticket deleted successfully')
      fetchTickets()
      fetchStats()
      closeDetailModal()
    } catch (err) {
      alert('Failed to delete ticket')
      console.error(err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f87171'
      case 'medium': return '#f59e0b'
      case 'low': return '#4ade80'
      default: return '#94a3b8'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'in_progress': return '#38bdf8'
      case 'resolved': return '#4ade80'
      case 'closed': return '#94a3b8'
      default: return '#64748b'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'fa-exclamation-triangle'
      case 'medium': return 'fa-circle-info'
      case 'low': return 'fa-check-circle'
      default: return 'fa-circle'
    }
  }

  return (
    <AdminLayout title="Support Tickets" subtitle="Manage customer support requests and inquiries">
      <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #0d0824 0%, #1a0f3e 100%)' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
              <i className="fas fa-headset mr-3" style={{ color: '#a28539' }}></i>
              Support Tickets
            </h1>
            <p className="text-gray-400">Manage customer support requests and inquiries</p>
          </div>
          <button
            onClick={() => { fetchTickets(); fetchStats(); }}
            className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(162,133,57,0.15)', border: '1px solid #a28539', color: '#a28539' }}
          >
            <i className="fas fa-sync mr-2"></i>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(162,133,57,0.1)', border: '1px solid rgba(162,133,57,0.2)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#a28539' }}>{stats.total}</div>
              <div className="text-xs text-gray-400">Total Tickets</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#f59e0b' }}>{stats.pending}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#38bdf8' }}>{stats.inProgress}</div>
              <div className="text-xs text-gray-400">In Progress</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#4ade80' }}>{stats.resolved}</div>
              <div className="text-xs text-gray-400">Resolved</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#94a3b8' }}>{stats.closed}</div>
              <div className="text-xs text-gray-400">Closed</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#f87171' }}>{stats.urgent}</div>
              <div className="text-xs text-gray-400">Urgent</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search tickets, users, emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(22,15,53,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{ background: 'rgba(22,15,53,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{ background: 'rgba(22,15,53,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {(statusFilter || priorityFilter || searchTerm) && (
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearchTerm(''); }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', color: '#f87171' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(22,15,53,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr style={{ background: '#1a1040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Ticket', 'User', 'Subject', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500"><i className="fas fa-spinner fa-spin mr-2" />Loading...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">No support tickets found.</td></tr>
              ) : tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer transition-colors hover:bg-white/5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onClick={() => openDetailModal(ticket)}
                >
                  <td className="px-4 py-4">
                    <div className="font-mono text-sm font-semibold" style={{ color: '#a28539' }}>
                      {ticket.ticketRef}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-white font-medium">{ticket.userFullName}</div>
                    <div className="text-xs text-gray-500">{ticket.userEmail}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-white max-w-xs truncate">{ticket.subject}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ background: `${getPriorityColor(ticket.priority)}20`, color: getPriorityColor(ticket.priority) }}>
                      <i className={`fas ${getPriorityIcon(ticket.priority)}`}></i>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ background: `${getStatusColor(ticket.status)}20`, color: getStatusColor(ticket.status) }}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); openDetailModal(ticket); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ background: 'rgba(162,133,57,0.15)', border: '1px solid #a28539', color: '#a28539' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={closeDetailModal}>
          <div 
            className="rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: 'linear-gradient(135deg, #0d0824 0%, #1a0f3e 100%)', border: '1px solid rgba(162,133,57,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#a28539' }}>
                    {selectedTicket.ticketRef}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ background: `${getPriorityColor(selectedTicket.priority)}20`, color: getPriorityColor(selectedTicket.priority) }}>
                      <i className={`fas ${getPriorityIcon(selectedTicket.priority)}`}></i>
                      {selectedTicket.priority}
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ background: `${getStatusColor(selectedTicket.status)}20`, color: getStatusColor(selectedTicket.status) }}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button onClick={closeDetailModal} className="text-gray-400 hover:text-white transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(162,133,57,0.1)', border: '1px solid rgba(162,133,57,0.2)' }}>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: '#a28539' }}>User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Name</div>
                    <div className="text-white font-medium">{selectedTicket.userFullName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="text-white font-medium">{selectedTicket.userEmail}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">User ID</div>
                    <div className="text-white font-medium">{selectedTicket.userId || 'Guest'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-white font-medium">
                      {new Date(selectedTicket.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: '#a28539' }}>Subject</h3>
                <div className="text-white text-lg">{selectedTicket.subject}</div>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: '#a28539' }}>Message</h3>
                <div className="p-4 rounded-lg text-white whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {selectedTicket.message}
                </div>
              </div>

              {/* Status Management */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: '#38bdf8' }}>Ticket Management</h3>
                
                {!editingStatus ? (
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                    style={{ background: 'rgba(162,133,57,0.2)', border: '1px solid #a28539', color: '#a28539' }}
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Update Status
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg outline-none"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg outline-none resize-none"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                        placeholder="Add internal notes about this ticket..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateStatus}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                        style={{ background: '#4ade80', color: '#000' }}
                      >
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
                      </button>
                      <button
                        onClick={() => { setEditingStatus(false); setNewStatus(selectedTicket.status); setAdminNotes(selectedTicket.adminNotes || ''); }}
                        className="px-4 py-2 rounded-lg font-medium transition-all"
                        style={{ background: 'rgba(148,163,184,0.2)', border: '1px solid #94a3b8', color: '#94a3b8' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Admin Notes */}
              {selectedTicket.adminNotes && !editingStatus && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: '#a28539' }}>Admin Notes</h3>
                  <div className="p-4 rounded-lg text-white whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {selectedTicket.adminNotes}
                  </div>
                </div>
              )}

              {/* Resolution Info */}
              {selectedTicket.resolvedAt && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: '#4ade80' }}>Resolution Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Resolved By</div>
                      <div className="text-white font-medium">{selectedTicket.resolvedByName || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Resolved At</div>
                      <div className="text-white font-medium">
                        {new Date(selectedTicket.resolvedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <a
                  href={`mailto:${selectedTicket.userEmail}?subject=Re: ${selectedTicket.subject} [${selectedTicket.ticketRef}]`}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-center transition-all hover:scale-105"
                  style={{ background: 'rgba(162,133,57,0.2)', border: '1px solid #a28539', color: '#a28539' }}
                >
                  <i className="fas fa-reply mr-2"></i>
                  Reply via Email
                </a>
                <button
                  onClick={() => handleDeleteTicket(selectedTicket.id)}
                  className="px-4 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ background: 'rgba(248,113,113,0.2)', border: '1px solid #f87171', color: '#f87171' }}
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  )
}
