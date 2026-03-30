import { ImagePlus, Laugh, Paperclip, Send, X } from 'lucide-react'

const EMOJI_LIST = ['😀', '😂', '😍', '🔥', '👍', '🙏', '🎉', '❤️', '😎', '🤝', '🚀', '💬']

function MessageComposer({
  attachments,
  disabled,
  messageText,
  showEmojiPicker,
  onAttachmentChange,
  onEmojiSelect,
  onMessageChange,
  onRemoveAttachment,
  onSend,
  onToggleEmojiPicker,
}) {
  return (
    <div className="relative border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      {showEmojiPicker && (
        <div className="absolute bottom-[calc(100%+12px)] left-4 z-20 w-[280px] rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:left-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Quick Emoji
          </p>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onEmojiSelect(emoji)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-lg transition hover:bg-indigo-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-4 flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {attachments.map((attachment, index) => (
            <div
              key={`${attachment.file.name}-${index}`}
              className="relative min-w-[112px] overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-2"
            >
              <img
                src={attachment.preview}
                alt={attachment.file.name}
                className="h-24 w-24 rounded-2xl object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveAttachment(index)}
                className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-white transition hover:bg-slate-900"
              >
                <X size={12} />
              </button>
              <p className="mt-2 truncate px-1 text-[11px] font-medium text-slate-600">
                {attachment.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex shrink-0 items-center gap-2">
          <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[18px] bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100">
            <Paperclip size={18} />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onAttachmentChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onToggleEmojiPicker}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-[18px] ring-1 transition ${
              showEmojiPicker
                ? 'bg-amber-50 text-amber-600 ring-amber-200'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            <Laugh size={18} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <textarea
            rows="1"
            value={messageText}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Write a message, share an update, or drop media..."
            className="min-h-[40px] w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          <div className="mt-0.5 flex items-center gap-2 px-2 text-[10px] text-slate-400">
            <ImagePlus size={12} />
            Images and text can be sent together
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onSend}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[18px] bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  )
}

export default MessageComposer
