import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SERVER_STATUS_EVENT, startHealthPolling } from './api'
import AccessDenied from './components/access-denied'
import AppShell from './components/app-shell'
import Auth from './components/auth'
import GlobalLoader from './components/global-loader'
import RouteInProgress from './components/route-in-progress'
import ServerError from './components/server-error'
import { refreshSidebarLinks, refreshRoutePermissions, selectAuth } from '../redux/slices/authSlice'
import { APP_ROUTES, APP_ROUTE_PATHS } from './routes/app-routes'
import { getSidebarLinkPath } from './utils/sidebar-links'

const getAllowedRoutes = (sidebarLinks) =>
  Object.values(sidebarLinks ?? {}).flatMap((groupLinks) =>
    groupLinks
      .map((link) => getSidebarLinkPath(link))
      .filter(Boolean),
  )

const normalizePath = (path = '') => {
  if (!path) return '/'
  const cleanedPath = path.split('?')[0].split('#')[0]
  if (cleanedPath === '/') return '/'
  return cleanedPath.replace(/\/+$/, '') || '/'
}

const getStaticBasePath = (route = '') => {
  const normalizedRoute = normalizePath(route)
  if (normalizedRoute === '/') return '/'

  const parts = normalizedRoute.split('/').filter(Boolean)
  const staticParts = []

  for (const part of parts) {
    if (part.startsWith(':')) break
    staticParts.push(part)
  }

  return staticParts.length ? `/${staticParts.join('/')}` : '/'
}

const matchesAllowedRoute = (pathname, allowedRoutes) => {
  const normalizedPathname = normalizePath(pathname)

  return allowedRoutes.some((route) => {
    const staticBasePath = getStaticBasePath(route)
    return (
      normalizedPathname === staticBasePath ||
      normalizedPathname.startsWith(`${staticBasePath}/`)
    )
  })
}

function ProtectedLayout({ isAuthenticated, isAccessAllowed, isAccessDeniedRoute }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAccessAllowed && !isAccessDeniedRoute) {
    return <Navigate to="/access-denied" replace />
  }

  return <AppShell />
}

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, sidebarLinks, user } = useSelector(selectAuth)
  const [hasServerError, setHasServerError] = useState(false)

  const allowedRoutes = useMemo(() => {
    if (!user) return []
    const rp = user.routePermissions
    // No permissions configured or allow_all → all routes accessible
    if (!rp || rp.mode === 'allow_all') return APP_ROUTE_PATHS
    // custom → only the explicit whitelist
    if (rp.mode === 'custom') return rp.allowedRoutes || []
    // block_all → nothing accessible
    return []
  }, [user])

  const isCurrentRouteAllowed = useMemo(
    () => matchesAllowedRoute(location.pathname, allowedRoutes),
    [allowedRoutes, location.pathname],
  )
  const isAccessDeniedRoute = location.pathname === '/access-denied'

  useEffect(() => {
    const stopHealthPolling = startHealthPolling(setHasServerError)

    let _offlineDebounceTimer = null
    const handleServerStatus = (event) => {
      const offline = event.detail?.hasServerError ?? false
      if (!offline) {
        // Online hone pe turant recover karo
        if (_offlineDebounceTimer) clearTimeout(_offlineDebounceTimer)
        setHasServerError(false)
      } else {
        // Offline page: 1.5s debounce — momentary blip ignore karo
        if (_offlineDebounceTimer) clearTimeout(_offlineDebounceTimer)
        _offlineDebounceTimer = setTimeout(() => setHasServerError(true), 1500)
      }
    }

    const handleOffline = () => {
      setHasServerError(true)
    }

    const handleOnline = () => {
      setHasServerError(false)
    }

    window.addEventListener(SERVER_STATUS_EVENT, handleServerStatus)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      stopHealthPolling()
      window.removeEventListener(SERVER_STATUS_EVENT, handleServerStatus)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(refreshSidebarLinks(user.id))
      dispatch(refreshRoutePermissions(user.id))
    }
  }, [dispatch, isAuthenticated, user?.id])

  if (hasServerError) {
    return <ServerError />
  }

  return (
    <>
      <GlobalLoader />
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />}
        />
        <Route
          element={
            <ProtectedLayout
              isAuthenticated={isAuthenticated}
              isAccessAllowed={isCurrentRouteAllowed}
              isAccessDeniedRoute={isAccessDeniedRoute}
            />
          }
        >
          <Route path="/access-denied" element={<AccessDenied />} />
          {APP_ROUTES.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
          <Route path="*" element={<RouteInProgress />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
