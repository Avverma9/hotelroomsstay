import { MessageSquareText, Search, Users } from 'lucide-react'

const formatTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function MessengerSidebar({
  activeTab,
  chats,
  contacts,
  loadingChats,
  loadingContacts,
  searchValue,
  selectedReceiverId,
  onSearchChange,
  onTabChange,
  onReceiverSelect,
}) {
  const dataList = activeTab === 'chat' ? chats : contacts
  const isLoading = activeTab === 'chat' ? loadingChats : loadingContacts

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="border-b border-slate-200 px-5 pb-5 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-700">
            <MessageSquareText size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Messenger</h2>
            <p className="text-sm text-slate-500">Chats, contacts and live presence</p>
          </div>
        </div>

        <div className="mb-4 flex rounded-2xl bg-slate-100 p-1">
          {[
            { key: 'chat', label: 'Chat' },
            { key: 'contacts', label: 'Contacts' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="relative block">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`Search ${activeTab === 'chat' ? 'chats' : 'contacts'}...`}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden">
        {isLoading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Loading {activeTab}...
          </div>
        )}

        {!isLoading && dataList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No {activeTab} available.
          </div>
        )}

        <div className="space-y-2">
          {dataList.map((item) => {
            const itemId = item.receiverId || item.userId
            const isActive = selectedReceiverId === itemId
            const image = Array.isArray(item.images) ? item.images[0] : item.images

            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onReceiverSelect(itemId)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {image ? (
                  <img
                    src={image}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600">
                    {item.name?.charAt(0)?.toUpperCase() || <Users size={18} />}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      {activeTab === 'contacts' && (
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            item.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {activeTab === 'chat'
                      ? item.content || (item.images?.length ? 'Attachment' : 'Start conversation')
                      : `${item.role || 'No role'}${item.mobile ? ` • ${item.mobile}` : ''}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default MessengerSidebar
