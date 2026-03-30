import { useEffect, useRef } from 'react'

const formatTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function MessageList({ currentUserId, loading, messages }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-6">
        <p className="text-sm text-slate-500">Loading conversation...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-6">
        <div className="max-w-sm rounded-3xl border border-slate-200 bg-white/90 px-6 py-8 text-center shadow-sm backdrop-blur">
          <p className="text-base font-semibold text-slate-900">No messages yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Start the conversation by sending the first message or image.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-5 sm:px-6 [&::-webkit-scrollbar]:hidden">
      <div className="space-y-4">
        {messages.map((message) => {
          const isSender = message.sender === currentUserId

          return (
            <div
              key={message._id}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                  isSender
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-800'
                }`}
              >
                {message.content && (
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>
                )}

                {message.images.length > 0 && (
                  <div className={`mt-3 grid gap-2 ${message.images.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                    {message.images.map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt="Message attachment"
                        className="max-h-56 w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                )}

                <div
                  className={`mt-2 text-[11px] ${
                    isSender ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default MessageList
