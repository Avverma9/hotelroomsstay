import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
} from 'lucide-react'
import {
  deleteGlobalNotification,
  deleteUserNotification,
  fetchGlobalNotifications,
  fetchUserNotifications,
  markGlobalNotificationSeen,
  markUserNotificationSeen,
  optimisticDelete,
  optimisticMarkSeen,
  selectAllNotifications,
  selectNotification,
  selectUnreadCount,
} from '../../redux/slices/admin/notification'
import { selectAuth } from '../../redux/slices/authSlice'

/* ── helpers ────────────────────────────────────────── */
const EVENT_COLORS = {
  offer:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  alert:   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  booking: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  payment: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  system:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500' },
  general: { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
}

const getEventColor = (type) => EVENT_COLORS[type] || EVENT_COLORS.general

const relativeTime = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const isToday = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

const isYesterday = (dateStr) => {
  const d = new Date(dateStr)
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear()
}

const groupNotifications = (notifs) => {
  const today = [], yesterday = [], older = []
  notifs.forEach((n) => {
    if (!n.createdAt) { older.push(n); return }
    if (isToday(n.createdAt)) today.push(n)
    else if (isYesterday(n.createdAt)) yesterday.push(n)
    else older.push(n)
  })
  return { today, yesterday, older }
}

/* ── NotificationItem ─────────────────────────────── */
function NotificationItem({ notif, userId, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const color = getEventColor(notif.eventType)

  const handleClick = () => {
    if (!notif.seen) {
      dispatch(optimisticMarkSeen({ notificationId: notif._id, type: notif._type }))
      if (notif._type === 'global') {
        dispatch(markGlobalNotificationSeen({ notificationId: notif._id, userId }))
      } else {
        dispatch(markUserNotificationSeen({ notificationId: notif._id, userId }))
      }
    }
    if (notif.path) {
      navigate(notif.path)
      onClose()
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    dispatch(optimisticDelete({ notificationId: notif._id, type: notif._type }))
    if (notif._type === 'global') {
      dispatch(deleteGlobalNotification(notif._id))
    } else {
      dispatch(deleteUserNotification(notif._id))
    }
  }

  const handleMarkSeen = (e) => {
    e.stopPropagation()
    dispatch(optimisticMarkSeen({ notificationId: notif._id, type: notif._type }))
    if (notif._type === 'global') {
      dispatch(markGlobalNotificationSeen({ notificationId: notif._id, userId }))
    } else {
      dispatch(markUserNotificationSeen({ notificationId: notif._id, userId }))
    }
  }

  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`group relative flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm ${
        notif.seen
          ? 'border-transparent bg-transparent hover:bg-slate-50'
          : `${color.bg} ${color.border} border`
      }`}
    >
      {/* Unread dot */}
      {!notif.seen && (
        <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${color.dot}`} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[12px] leading-snug font-bold truncate max-w-[180px] ${notif.seen ? 'text-slate-600' : 'text-slate-900'}`}>
            {notif.name}
          </p>
          <span className="shrink-0 text-[10px] font-medium text-slate-400">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{notif.message}</p>
        {notif.eventType && notif.eventType !== 'general' && (
          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${color.text}`}>
            {notif.eventType}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1">
        {!notif.seen && (
          <button
            onClick={handleMarkSeen}
            title="Mark as read"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <Check size={11} />
          </button>
        )}
        <button
          onClick={handleDelete}
          title="Delete"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-rose-600 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

/* ── Group label ─────────────────────────────────────── */
function GroupLabel({ label }) {
  return (
    <p className="px-1 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {label}
    </p>
  )
}

/* ── NotificationBell (exported — used in header) ─────── */
export function NotificationBell({ userId, onClick, isOpen }) {
  const unread = useSelector(selectUnreadCount)

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      title="Notifications"
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}

/* ── NotificationDropdown (exported — used in header) ─── */
export default function NotificationDropdown({ userId, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { fetching } = useSelector(selectNotification)
  const allNotifs = useSelector(selectAllNotifications)
  const unread = useSelector(selectUnreadCount)
  const dropdownRef = useRef(null)

  // Fetch on mount
  useEffect(() => {
    if (!userId) return
    dispatch(fetchUserNotifications(userId))
    dispatch(fetchGlobalNotifications(userId))
  }, [dispatch, userId])

  // Click outside closes
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const recent = allNotifs.slice(0, 20)
  const { today, yesterday, older } = groupNotifications(recent)

  const handleMarkAll = useCallback(() => {
    allNotifs.forEach((n) => {
      if (!n.seen) {
        dispatch(optimisticMarkSeen({ notificationId: n._id, type: n._type }))
        if (n._type === 'global') {
          dispatch(markGlobalNotificationSeen({ notificationId: n._id, userId }))
        } else {
          dispatch(markUserNotificationSeen({ notificationId: n._id, userId }))
        }
      }
    })
  }, [allNotifs, dispatch, userId])

  const handleViewAll = () => {
    navigate('/admin-notification')
    onClose()
  }

  return (
    <div
      ref={dropdownRef}
      role="menu"
      className="absolute right-0 top-[calc(100%+12px)] z-30 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Notifications</p>
          <p className="text-[10px] font-medium text-slate-400">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fetching && <Loader2 size={14} className="animate-spin text-slate-400" />}
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              title="Mark all as read"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <CheckCheck size={12} /> All read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto px-3 py-2 space-y-0.5" aria-label="Notifications list">
        {allNotifs.length === 0 && !fetching && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff size={28} className="mb-3 text-slate-200" />
            <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">We'll notify you when something arrives</p>
          </div>
        )}

        {today.length > 0 && (
          <>
            <GroupLabel label="Today" />
            {today.map((n) => (
              <NotificationItem key={n._id} notif={n} userId={userId} onClose={onClose} />
            ))}
          </>
        )}

        {yesterday.length > 0 && (
          <>
            <GroupLabel label="Yesterday" />
            {yesterday.map((n) => (
              <NotificationItem key={n._id} notif={n} userId={userId} onClose={onClose} />
            ))}
          </>
        )}

        {older.length > 0 && (
          <>
            <GroupLabel label="Older" />
            {older.map((n) => (
              <NotificationItem key={n._id} notif={n} userId={userId} onClose={onClose} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full rounded-xl bg-slate-900 py-2 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors"
        >
          View Notification Center
        </button>
      </div>
    </div>
  )
}
