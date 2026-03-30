import { WifiOff, RefreshCw } from 'lucide-react'

function ServerError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(254,226,226,0.7),_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#ffffff_100%)] px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-red-100 bg-white p-10 text-center shadow-[0_24px_80px_rgba(248,113,113,0.18)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
          <WifiOff size={34} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-900">
          Server connection lost
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Backend se connection nahi ho pa raha hai. Hum `/health` endpoint ko
          poll kar rahe hain. Jaise hi server wapas aayega, app automatically
          normal screen par aa jayegi.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mx-auto mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <RefreshCw size={16} />
          Retry Now
        </button>
      </div>
    </div>
  )
}

export default ServerError
