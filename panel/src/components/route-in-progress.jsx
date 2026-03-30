import { Construction, MoveRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const getRouteLabel = (pathname = '') => {
  const segment = pathname.split('/').filter(Boolean).pop() || 'route'
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function RouteInProgress() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeLabel = getRouteLabel(location.pathname)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eff6ff,_#ffffff_45%,_#e2e8f0_100%)] px-6 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <div className="border-b border-slate-100 bg-slate-950 px-8 py-10 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-sky-300 backdrop-blur">
            <Construction size={30} />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight">
            We are working on this route
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            <span className="font-semibold text-white">{routeLabel}</span> is available in the
            navigation, but this screen is still under development.
          </p>
        </div>

        <div className="px-8 py-8">
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Requested Path
            </p>
            <p className="mt-2 break-all text-base font-semibold text-slate-900">
              {location.pathname}
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Team is busy building this page. You can come back later or continue with the
              modules that are already live.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go To Dashboard
              <MoveRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteInProgress
