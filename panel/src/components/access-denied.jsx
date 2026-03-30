import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert size={30} />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
          Access Denied
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
         You dont have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go To Dashboard
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
  )
}

export default AccessDenied
