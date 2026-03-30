import { Circle, Phone, ShieldCheck } from 'lucide-react'

function ChatHeader({ receiver, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-sm text-slate-500">Loading receiver details...</p>
      </div>
    )
  }

  if (!receiver) {
    return (
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-sm text-slate-500">Select a contact or recent chat to begin.</p>
      </div>
    )
  }

  const profileImage = Array.isArray(receiver.images) ? receiver.images[0] : receiver.images

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {profileImage ? (
          <img
            src={profileImage}
            alt={receiver.name}
            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600">
            {receiver.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{receiver.name}</p>
            <Circle
              size={10}
              className={receiver.isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-300 text-slate-300'}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {receiver.role || 'No role'} {receiver.mobile ? `• ${receiver.mobile}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-full bg-slate-100 p-2.5 text-slate-500">
          <Phone size={16} />
        </div>
        <div className="rounded-full bg-slate-100 p-2.5 text-slate-500">
          <ShieldCheck size={16} />
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
