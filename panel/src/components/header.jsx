import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, ChevronRight, LogOut, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { logoutUser, selectAuth } from '../../redux/slices/authSlice'
import NotificationDropdown from './notification-dropdown'
import { selectUnreadCount } from '../../redux/slices/admin/notification'
import { getSidebarLinkLabel, getSidebarLinkPath } from '../utils/sidebar-links'

function UnreadBadge() {
  const unread = useSelector(selectUnreadCount)
  if (!unread) return null
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
      {unread > 99 ? '99+' : unread}
    </span>
  )
}

function Header({ className = '' }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const { user, sidebarLinks } = useSelector(selectAuth)
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const allRoutes = useMemo(
    () =>
      Object.entries(sidebarLinks ?? {}).flatMap(([section, links]) =>
        links
          .filter((item) => !item.isParentOnly)
          .map((item) => ({
          id: item.id || item._id,
          section,
          route: getSidebarLinkPath(item) || '/dashboard',
          label: getSidebarLinkLabel(item),
        })),
      ),
    [sidebarLinks],
  )

  const matchedRoutes = useMemo(() => {
    const searchValue = query.trim().toLowerCase()

    if (!searchValue) {
      return []
    }

    return allRoutes
      .filter(
        (item) =>
          item.label.toLowerCase().includes(searchValue) ||
          item.route.toLowerCase().includes(searchValue) ||
          item.section.toLowerCase().includes(searchValue),
      )
      .slice(0, 8)
  }, [allRoutes, query])

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    if (matchedRoutes.length === 0) {
      return
    }

    navigate(matchedRoutes[0].route)
    setQuery('')
    setShowResults(false)
  }

  const handleRouteClick = (route) => {
    navigate(route)
    setQuery('')
    setShowResults(false)
  }

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/', { replace: true })
    setShowProfileMenu(false)
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setShowResults(false)
      }

      if (!profileRef.current?.contains(event.target)) {
        setShowProfileMenu(false)
      }

      if (!notificationRef.current?.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6 ${className}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form
          ref={searchRef}
          onSubmit={handleSearchSubmit}
          className="relative w-full lg:max-w-3xl"
        >
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setShowResults(event.target.value.trim().length > 0)
            }}
            onFocus={() => {
              if (query.trim()) {
                setShowResults(true)
              }
            }}
            placeholder="Search routes like hotels, bookings, users..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
          />

          {showResults && (
            <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              {matchedRoutes.length === 0 && (
                <div className="px-4 py-4 text-sm text-slate-500">
                  No matching route found.
                </div>
              )}

              {matchedRoutes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRouteClick(item.route)}
                  className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {item.section} · {item.route}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 self-end lg:self-auto">
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((previousValue) => !previousValue)
                setShowProfileMenu(false)
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              title="Notifications"
            >
              <Bell size={18} />
              <UnreadBadge />
            </button>

            {showNotifications && (
              <NotificationDropdown
                userId={user?.id}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu((previousValue) => !previousValue)
                setShowNotifications(false)
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
              title={user?.name || 'User menu'}
            >
              {user?.image?.[0] ? (
                <img
                  src={user.image[0]}
                  alt={user?.name || 'User'}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <User size={18} />
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-30 min-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.name || 'Dashboard User'}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email || 'No email found'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
