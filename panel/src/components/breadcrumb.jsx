import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ChevronRight, Home } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { selectAuth } from '../../redux/slices/authSlice'
import { deriveLabelFromPath, getSidebarLinkLabel, getSidebarLinkPath } from '../utils/sidebar-links'

function Breadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarLinks } = useSelector(selectAuth)

  const routeLabelMap = useMemo(() => {
    const map = {
      '/dashboard': 'Dashboard',
    }

    Object.values(sidebarLinks ?? {}).forEach((links) => {
      links.forEach((item) => {
        const route = getSidebarLinkPath(item)

        if (route) {
          map[route] = getSidebarLinkLabel(item)
        }
      })
    })

    return map
  }, [sidebarLinks])

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return [{ label: 'Dashboard', path: '/dashboard' }]
    }

    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`

      return {
        label: routeLabelMap[path] || deriveLabelFromPath(segment),
        path,
      }
    })
  }, [location.pathname, routeLabelMap])

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm transition hover:text-slate-900"
      >
        <Home size={14} className="text-slate-400" />
        <span>Home</span>
      </button>

      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-slate-300" />
          <button
            type="button"
            onClick={() => navigate(item.path)}
            className={`transition hover:text-slate-900 ${
              index === breadcrumbs.length - 1
                ? 'font-semibold text-slate-900'
                : 'text-slate-500'
            }`}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

export default Breadcrumb
