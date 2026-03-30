import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeDollarSign,
  Bell,
  Car,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Grid2x2,
  Hotel,
  Image,
  LayoutDashboard,
  LogOut,
  MenuSquare,
  MessageCircleMore,
  MessageSquare,
  Settings,
  Ticket,
  UserRound,
  UsersRound,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { logoutUser, selectAuth } from '../../redux/slices/authSlice'
import { getSidebarLinkLabel, getSidebarLinkPath } from '../utils/sidebar-links'

const ICON_ALIAS_MAP = {
  MdDashboard: 'LayoutDashboard',
  MdPeople: 'Users',
  MdPerson: 'UserRound',
  MdSettings: 'Settings',
  MdMessage: 'MessageSquare',
  MdHotel: 'Hotel',
  MdNotifications: 'Bell',
  MdDirectionsCar: 'Car',
  MdImage: 'Image',
  MdMenu: 'MenuSquare',
  FaRegUserCircle: 'UserRound',
  FaUsers: 'Users',
  FaHotel: 'Hotel',
  FaBell: 'Bell',
  FaCog: 'Settings',
  FaClipboardList: 'ClipboardList',
}

const getIconComponent = (iconName = '') => {
  const aliasedIconName = ICON_ALIAS_MAP[iconName] || iconName

  if (LucideIcons[aliasedIconName]) return LucideIcons[aliasedIconName]
  if (LucideIcons[iconName]) return LucideIcons[iconName]

  const normalizedIconName = aliasedIconName.toLowerCase()
  if (normalizedIconName.includes('dashboard')) return LayoutDashboard
  if (normalizedIconName.includes('person') || normalizedIconName.includes('user')) return UserRound
  if (normalizedIconName.includes('messenger')) return MessageSquare
  if (normalizedIconName.includes('car')) return Car
  if (normalizedIconName.includes('group')) return UsersRound
  if (normalizedIconName.includes('hotel')) return Hotel
  if (normalizedIconName.includes('coupon')) return Ticket
  if (normalizedIconName.includes('dollar')) return BadgeDollarSign
  if (normalizedIconName.includes('feedback') || normalizedIconName.includes('info')) return MessageCircleMore
  if (normalizedIconName.includes('image')) return Image
  if (normalizedIconName.includes('bell')) return Bell
  if (normalizedIconName.includes('menu')) return MenuSquare
  if (normalizedIconName.includes('ticket') || normalizedIconName.includes('tour')) return Ticket
  if (normalizedIconName.includes('setting')) return Settings
  if (normalizedIconName.includes('activity') || normalizedIconName.includes('booking')) return ClipboardList
  return Grid2x2
}

const sortLinks = (links = []) =>
  [...links].sort((firstItem, secondItem) => (firstItem.order ?? 0) - (secondItem.order ?? 0))

const SIDEBAR_SCROLL_KEY    = 'hrsadmin:sidebar-scroll-top'
const SIDEBAR_SECTIONS_KEY  = 'hrsadmin:sidebar-sections'

function Sidebar({ className = '' }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, sidebarLinks } = useSelector(selectAuth)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem(SIDEBAR_SECTIONS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const navScrollRef = useRef(null)
  
  const sections = useMemo(() => Object.entries(sidebarLinks ?? {}), [sidebarLinks])
  
  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/', { replace: true })
  }
  
  const toggleSection = (sectionTitle) => {
    setExpandedSections((prev) => {
      const updated = { ...prev, [sectionTitle]: prev[sectionTitle] !== false ? false : true }
      try {
        window.sessionStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(updated))
      } catch { /* storage unavailable */ }
      return updated
    })
  }

  // Restore scroll position
  useEffect(() => {
    const navElement = navScrollRef.current
    if (!navElement) return

    const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY)
    if (savedScrollTop) {
      navElement.scrollTop = Number(savedScrollTop)
    }
  }, [])

  // Save scroll position
  useEffect(() => {
    const navElement = navScrollRef.current
    if (!navElement) return undefined

    const handleScroll = () => {
      window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(navElement.scrollTop))
    }
    navElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => navElement.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll active item into view — only on route change or sidebar collapse toggle,
  // NOT on section expand/collapse (that caused the jump-to-bottom bug)
  useEffect(() => {
    const navElement = navScrollRef.current
    if (!navElement) return

    requestAnimationFrame(() => {
      const activeItem = navElement.querySelector('.sidebar-active-link')
      if (!activeItem) return

      activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(navElement.scrollTop))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isCollapsed])

  return (
    <div className={`relative shrink-0 ${isCollapsed ? 'w-[84px]' : 'w-72'} ${className}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-200/60 bg-white/80 text-slate-700 shadow-[10px_0_40px_-10px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? 'w-[84px]' : 'w-72'
        }`}
      >
      {/* Brand / Logo Area */}
      <div className="flex h-24 shrink-0 items-center justify-between px-6">
        {!isCollapsed && (
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-[0_8px_16px_-6px_rgba(79,70,229,0.5)]">
              <Grid2x2 size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="truncate text-[16px] font-extrabold tracking-tight text-slate-900 leading-none">
                HRS ADMIN
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wider uppercase mt-1">
                Workspace
              </span>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`group absolute top-8 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none ${
            isCollapsed ? 'left-1/2 -translate-x-1/2' : '-right-4'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={16} strokeWidth={2.5} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
          ) : (
            <ChevronLeft size={16} strokeWidth={2.5} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div
        ref={navScrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:hidden"
      >
        {sections.length === 0 && (
          <div className="mx-2 mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm font-medium text-slate-500">
            No navigation links available.
          </div>
        )}

        {sections.map(([sectionTitle, links]) => {
          const isOpen = expandedSections[sectionTitle] !== false

          return (
            <div key={sectionTitle} className="mb-7">
              {/* Section Header */}
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(sectionTitle)}
                  className="mb-3 flex w-full items-center justify-between px-2 text-left transition-colors group"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 group-hover:text-indigo-500 transition-colors">
                    {sectionTitle}
                  </span>
                  <ChevronRight
                    size={14}
                    strokeWidth={3}
                    className={`text-slate-300 group-hover:text-indigo-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              ) : (
                <div className="mb-4 mt-6 flex justify-center">
                  <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                </div>
              )}

              {/* Section Links */}
              <div
                className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isOpen || isCollapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden space-y-1.5">
                  {sortLinks(links).map((item) => {
                    const Icon = getIconComponent(item.icon)
                    const path = getSidebarLinkPath(item)
                    const label = getSidebarLinkLabel(item)

                    if (item.isParentOnly) {
                      return (
                        <div
                          key={item.id || item._id || `${sectionTitle}-${label}`}
                          title={label}
                          className={`group relative flex items-center rounded-xl ${
                            isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'gap-3.5 px-3.5 py-2.5'
                          } text-slate-500`}
                        >
                          <Icon
                            size={20}
                            strokeWidth={2}
                            className={`shrink-0 text-slate-400 ${isCollapsed ? 'group-hover:scale-110' : ''}`}
                          />
                          {!isCollapsed && (
                            <div className="min-w-0">
                              <span className="truncate text-[14px] font-medium">
                                {label}
                              </span>
                              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                Group Only
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <NavLink
                        key={item.id || item._id || path}
                        to={path || '/dashboard'}
                        end
                        title={label}
                        className={({ isActive }) =>
                          `group relative flex items-center rounded-xl transition-all duration-200 ${
                            isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'gap-3.5 px-3.5 py-2.5'
                          } ${
                            isActive
                              ? 'sidebar-active-link bg-gradient-to-r from-indigo-50/80 to-transparent text-indigo-700 font-semibold'
                              : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Active Edge Indicator */}
                            {isActive && !isCollapsed && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-indigo-600 shadow-[2px_0_8px_rgba(79,70,229,0.4)]" />
                            )}
                            
                            <Icon 
                              size={20} 
                              strokeWidth={isActive ? 2.5 : 2}
                              className={`shrink-0 transition-all duration-300 ${
                                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
                              } ${isCollapsed ? 'group-hover:scale-110' : ''}`} 
                            />
                            
                            {!isCollapsed && (
                              <span className="truncate text-[14px] transition-transform duration-200 group-hover:translate-x-0.5">
                                {label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Combined Profile & Logout Footer */}
      <div className="mt-auto px-4 pb-6 pt-4 border-t border-slate-100 bg-gradient-to-b from-transparent to-slate-50/50">
        <div className={`flex items-center gap-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm transition-all duration-300 ${isCollapsed ? 'flex-col p-2' : 'p-2.5'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-slate-800">
                {user?.name ?? 'Unknown User'}
              </p>
              <p className="truncate text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                {role || user?.role || 'Administrator'}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`flex items-center justify-center shrink-0 rounded-xl transition-all duration-200 text-slate-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 ${
              isCollapsed ? 'w-10 h-10 mt-1' : 'w-10 h-10 mr-1'
            }`}
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      </aside>
    </div>
  )
}

export default Sidebar
