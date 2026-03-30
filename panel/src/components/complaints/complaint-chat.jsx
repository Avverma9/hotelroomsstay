import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Building2, CheckCircle2, Hash,
  Loader2, MessageSquare, Send, User, Clock, Info
} from 'lucide-react';
import {
  fetchComplaintById,
  sendChatMessage,
  clearSelectedComplaint,
} from '../../../redux/slices/complaintSlice';
import { selectAuth } from '../../../redux/slices/authSlice';

/* ── Helpers ─────────────────────────────────────────────── */
const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (new Date().toDateString() === date.toDateString()) return 'Today';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG = {
  Pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Approved: { cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  Working:  { cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  Resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Rejected: { cls: 'bg-rose-50 text-rose-700 border-rose-200',    dot: 'bg-rose-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${cfg.dot}`} />
      {status || 'Pending'}
    </span>
  );
};

/* ── Chat Bubble Component ───────────────────────────────── */
const Bubble = ({ msg, isOwn }) => {
  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
      <div className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-3 shadow-sm ${
        isOwn 
          ? 'rounded-2xl rounded-tr-sm bg-blue-600 text-white shadow-blue-600/20' 
          : 'rounded-2xl rounded-tl-sm bg-white border border-zinc-200 text-zinc-800 shadow-zinc-200/40'
      }`}>
        {!isOwn && (
          <div className="mb-1 flex items-center gap-1.5">
            <User size={12} className="text-blue-500" />
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
              {msg.sender || 'User'}
            </span>
          </div>
        )}
        <p className={`text-[13px] sm:text-sm font-medium leading-relaxed ${isOwn ? 'text-white' : 'text-zinc-700'}`}>
          {msg.content}
        </p>
        <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] font-semibold ${isOwn ? 'text-blue-200' : 'text-zinc-400'}`}>
          <Clock size={10} />
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
export default function ComplaintChat() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { user } = useSelector(selectAuth);
  const { selectedComplaint, chatLoading, loading, error } = useSelector((s) => s.complaints);

  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  // Identify the admin's name
  const senderName = user?.name || user?.fullName || user?.email || 'Admin';

  useEffect(() => {
    if (id) dispatch(fetchComplaintById(id));
    return () => { dispatch(clearSelectedComplaint()); };
  }, [dispatch, id]);

  const chats = useMemo(() => selectedComplaint?.chats || [], [selectedComplaint?.chats]);

  // Smooth scroll to bottom whenever chats change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats]);

  // Logic: If receiver is 'User' or sender matches Admin's name, it's an outbound (Admin) message.
  const isOwn = (msg) => {
    if (msg.receiver === 'User') return true;
    if (msg.sender && msg.sender.trim().toLowerCase() === senderName.trim().toLowerCase()) return true;
    return false;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || !selectedComplaint || isSending) return;

    const messageData = {
      sender: senderName,
      receiver: 'User', // Admin always replies to the user
      content: text,
    };

    setIsSending(true);
    setContent(''); // Optimistic clear for snappy UX

    try {
      // complaintId is the 8-digit ID, not the MongoDB _id
      await dispatch(sendChatMessage({
        complaintId: selectedComplaint.complaintId,
        messageData,
      })).unwrap();
    } catch (err) {
      console.error('Failed to send message:', err);
      setContent(text); // Revert text if failed
    } finally {
      setIsSending(false);
    }
  };

  /* ── Loading State ─────────────────────────────────────── */
  if (loading && !selectedComplaint) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4 text-center animate-pulse">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
          <p className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Loading Session...</p>
        </div>
      </div>
    );
  }

  /* ── Error State ───────────────────────────────────────── */
  if (error && !selectedComplaint) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md flex-col items-center gap-5 text-center rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl shadow-zinc-200/50">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-5">
            <AlertCircle size={36} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 mb-2">Issue Not Found</h2>
          <p className="text-sm font-medium text-zinc-500 mb-8">{typeof error === 'string' ? error : 'The requested complaint could not be loaded.'}</p>
          <button onClick={() => navigate(-1)}
            className="w-full rounded-2xl bg-zinc-900 px-6 py-4 text-sm font-bold text-white shadow-lg hover:bg-zinc-800 transition-all hover:-translate-y-0.5">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isClosed = selectedComplaint?.status === 'Resolved' || selectedComplaint?.status === 'Rejected';

  /* ── Main UI ───────────────────────────────────────────── */
  return (
    <div className="flex h-screen flex-col bg-zinc-50/50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex shrink-0 items-center gap-4 border-b border-zinc-200/80 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <button onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900">
          <ArrowLeft size={18} />
        </button>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
          <MessageSquare size={20} className="text-blue-600" />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="truncate text-base font-black text-zinc-900">
              {selectedComplaint?.hotelName || 'Support Ticket'}
            </h1>
            {selectedComplaint?.status && <StatusBadge status={selectedComplaint.status} />}
          </div>
          {selectedComplaint && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Hash size={12} className="text-zinc-300"/> ID: {selectedComplaint.complaintId}</span>
              <span className="flex items-center gap-1.5"><Building2 size={12} className="text-zinc-300"/> {selectedComplaint.regarding}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Feed ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 custom-scrollbar">
        
        {/* Context Banner */}
        {selectedComplaint && (
          <div className="mx-auto max-w-3xl mb-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <Info size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Reported Issue</p>
                <p className="text-sm font-semibold leading-relaxed text-zinc-800">{selectedComplaint.issue}</p>
                
                {Array.isArray(selectedComplaint.updatedBy) && selectedComplaint.updatedBy.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Latest Admin Note</p>
                    <p className="text-xs font-medium text-zinc-700">
                      {selectedComplaint.updatedBy[selectedComplaint.updatedBy.length - 1].feedBack}
                    </p>
                  </div>
                )}
                {selectedComplaint.bookingId && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                    Booking Ref: {selectedComplaint.bookingId}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date Divider */}
        {chats.length > 0 && (
          <div className="flex items-center justify-center my-6">
            <span className="rounded-full bg-zinc-200/50 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 backdrop-blur-sm">
              {formatDate(chats[0]?.timestamp || new Date())}
            </span>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-4">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 ring-8 ring-blue-50/50">
                <MessageSquare size={32} className="text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">No Messages Yet</h3>
              <p className="text-sm font-medium text-zinc-500 mt-1">Send a message to start assisting the user.</p>
            </div>
          ) : (
            chats.map((msg) => (
              <Bubble key={msg._id || msg.timestamp} msg={msg} isOwn={isOwn(msg)} />
            ))
          )}

          {/* Local Loading Indicator when Admin is sending */}
          {(chatLoading || isSending) && (
            <div className="flex justify-end animate-in fade-in">
              <div className="flex max-w-[70%] items-center gap-1.5 rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3.5 text-white shadow-sm">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-200" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* ── Input Area ─────────────────────────────────────── */}
      <div className="shrink-0 bg-white/80 backdrop-blur-xl border-t border-zinc-200 pb-safe">
        {isClosed ? (
          <div className="mx-auto max-w-3xl p-4 sm:p-6">
            <div className={`flex items-center justify-center gap-2.5 rounded-2xl border py-4 text-sm font-bold ${
              selectedComplaint.status === 'Resolved' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <CheckCircle2 size={18} />
              Ticket Marked as {selectedComplaint.status}. Chat is now closed.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="mx-auto max-w-3xl p-4 sm:p-6">
            <div className="flex items-end gap-3 relative">
              <div className="flex-1 relative">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your response here..."
                  disabled={isSending}
                  className="w-full rounded-3xl border border-zinc-200 bg-zinc-50 pl-5 pr-12 py-3.5 text-sm font-semibold text-zinc-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:font-medium placeholder:text-zinc-400 disabled:opacity-50"
                />
              </div>
              <button 
                type="submit" 
                disabled={!content.trim() || isSending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              >
                {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <User size={12} />
              Replying as <span className="text-zinc-700">{senderName}</span>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}