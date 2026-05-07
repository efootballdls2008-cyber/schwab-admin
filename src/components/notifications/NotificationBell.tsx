import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import type { AdminNotification } from '../../types'

const TYPE_ICON: Record<string, string> = {
  user:       'fas fa-user-plus',
  login:      'fas fa-sign-in-alt',
  deposit:    'fas fa-arrow-down',
  withdrawal: 'fas fa-arrow-up',
  order:      'fas fa-shopping-cart',
  success:    'fas fa-check-circle',
  warning:    'fas fa-exclamation-triangle',
  error:      'fas fa-times-circle',
  info:       'fas fa-info-circle',
}

const TYPE_COLOR: Record<string, string> = {
  user:       '#6366f1',
  login:      '#8b5cf6',
  deposit:    '#10b981',
  withdrawal: '#f59e0b',
  order:      '#3b82f6',
  success:    '#10b981',
  warning:    '#f59e0b',
  error:      '#ef4444',
  info:       '#6b7280',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllAsRead, remove } = useNotifications()
  const [open, setOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSelectedNotif(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleNotifClick = async (notif: AdminNotification) => {
    if (!notif.isRead) await markRead(notif.id)
    setSelectedNotif(notif)
  }

  const handleViewAll = () => {
    setOpen(false)
    setSelectedNotif(null)
    navigate('/admin/notifications')
  }

  const recent = notifications.slice(0, 8)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); setSelectedNotif(null) }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
        style={{ background: open ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)', color: open ? '#c9a84c' : '#9ca3af' }}
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-sm" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
            style={{ background: '#ef4444', fontSize: 9, minWidth: 16, height: 16, padding: '0 3px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{
            width: 360,
            background: '#0d0824',
            border: '1px solid rgba(255,255,255,0.1)',
            top: '100%',
          }}
        >
          {/* Detail view */}
          {selectedNotif ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-arrow-left text-sm" />
                </button>
                <span className="text-sm font-semibold text-white">Notification Detail</span>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${TYPE_COLOR[selectedNotif.type] || TYPE_COLOR.info}22` }}
              >
                <i
                  className={`${TYPE_ICON[selectedNotif.type] || TYPE_ICON.info} text-sm`}
                  style={{ color: TYPE_COLOR[selectedNotif.type] || TYPE_COLOR.info }}
                />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{selectedNotif.title}</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#9ca3af' }}>{selectedNotif.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#6b7280' }}>{timeAgo(selectedNotif.createdAt)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { remove(selectedNotif.id); setSelectedNotif(null) }}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleViewAll}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#ef4444', color: '#fff' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: '#c9a84c' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <i className="fas fa-bell-slash text-2xl" style={{ color: '#374151' }} />
                    <p className="text-xs" style={{ color: '#6b7280' }}>No notifications yet</p>
                  </div>
                ) : (
                  recent.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: notif.isRead ? 'transparent' : 'rgba(201,168,76,0.04)',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${TYPE_COLOR[notif.type] || TYPE_COLOR.info}22` }}
                      >
                        <i
                          className={`${TYPE_ICON[notif.type] || TYPE_ICON.info} text-xs`}
                          style={{ color: TYPE_COLOR[notif.type] || TYPE_COLOR.info }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: notif.isRead ? '#9ca3af' : '#fff' }}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                              style={{ background: '#c9a84c' }}
                            />
                          )}
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6b7280' }}>
                          {notif.message}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div
                className="px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  onClick={handleViewAll}
                  className="w-full text-xs font-medium py-1.5 rounded-lg transition-colors"
                  style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.08)' }}
                >
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
