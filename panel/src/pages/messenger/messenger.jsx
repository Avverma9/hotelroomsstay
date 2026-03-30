import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAuth } from '../../../redux/slices/authSlice'
import {
  appendIncomingMessage,
  clearMessengerError,
  fetchChatMessages,
  fetchMessengerContacts,
  fetchReceiverProfile,
  fetchRecentChats,
  resetMessengerState,
  selectMessenger,
  sendChatMessage,
  setActiveMessengerTab,
  setSelectedMessengerReceiver,
  updateMessengerUserStatus,
} from '../../../redux/slices/messenger'
import ChatHeader from '../../components/messenger/chat-header'
import MessageComposer from '../../components/messenger/message-composer'
import MessageList from '../../components/messenger/message-list'
import MessengerSidebar from '../../components/messenger/messenger-sidebar'
import { createMessengerSocket, disconnectMessengerSocket } from '../../utils/socket'

function Messenger() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const {
    activeTab,
    chats,
    contacts,
    error,
    loadingChats,
    loadingContacts,
    loadingMessages,
    loadingReceiver,
    messages,
    selectedReceiver,
    selectedReceiverId,
    sendingMessage,
  } = useSelector(selectMessenger)
  const socketRef = useRef(null)
  const selectedReceiverIdRef = useRef('')
  const attachmentsRef = useRef([])
  const [searchValue, setSearchValue] = useState('')
  const [messageText, setMessageText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    selectedReceiverIdRef.current = selectedReceiverId
  }, [selectedReceiverId])

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    if (!user?.id) {
      return undefined
    }

    dispatch(fetchMessengerContacts(user.id))
    dispatch(fetchRecentChats(user.id))

    const socket = createMessengerSocket({
      userId: user.id,
      onMessage: (payload) => {
        const normalizedSenderId =
          typeof payload?.sender === 'string'
            ? payload.sender
            : payload?.sender?.$oid || payload?.sender?._id || payload?.senderId || ''

        const normalizedReceiverId =
          typeof payload?.receiver === 'string'
            ? payload.receiver
            : payload?.receiver?.$oid || payload?.receiver?._id || payload?.receiverId || ''

        const isActiveConversation =
          selectedReceiverIdRef.current &&
          [normalizedSenderId, normalizedReceiverId].includes(selectedReceiverIdRef.current)

        if (isActiveConversation || normalizedSenderId === user.id || normalizedReceiverId === user.id) {
          dispatch(appendIncomingMessage(payload))
        }

        dispatch(fetchRecentChats(user.id))
      },
      onStatusUpdate: (payload) => {
        dispatch(updateMessengerUserStatus(payload))
      },
    })

    socketRef.current = socket

    return () => {
      disconnectMessengerSocket(socket, user.id)
      dispatch(resetMessengerState())
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (!user?.id || !selectedReceiverId) {
      return
    }

    dispatch(fetchReceiverProfile(selectedReceiverId))
    dispatch(
      fetchChatMessages({
        receiverId: selectedReceiverId,
        senderId: user.id,
      }),
    )
  }, [dispatch, selectedReceiverId, user?.id])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        URL.revokeObjectURL(attachment.preview)
      })
    }
  }, [])

  const filteredChats = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return chats
    return chats.filter((chat) => chat.name.toLowerCase().includes(query))
  }, [chats, searchValue])

  const filteredContacts = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter((contact) => contact.name.toLowerCase().includes(query))
  }, [contacts, searchValue])

  const handleReceiverSelect = (receiverId) => {
    dispatch(setSelectedMessengerReceiver(receiverId))
    dispatch(setActiveMessengerTab('chat'))
    setShowEmojiPicker(false)
  }

  const handleAttachmentChange = (event) => {
    const nextFiles = Array.from(event.target.files || []).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setAttachments((currentAttachments) => [...currentAttachments, ...nextFiles])
    event.target.value = ''
  }

  const handleRemoveAttachment = (index) => {
    setAttachments((currentAttachments) => {
      const targetAttachment = currentAttachments[index]

      if (targetAttachment?.preview) {
        URL.revokeObjectURL(targetAttachment.preview)
      }

      return currentAttachments.filter((_, attachmentIndex) => attachmentIndex !== index)
    })
  }

  const handleSendMessage = async () => {
    if (!user?.id || !selectedReceiverId) {
      return
    }

    const trimmedMessage = messageText.trim()
    const files = attachments.map((attachment) => attachment.file)

    if (!trimmedMessage && files.length === 0) {
      return
    }

    try {
      const sentMessage = await dispatch(
        sendChatMessage({
          senderId: user.id,
          receiverId: selectedReceiverId,
          content: trimmedMessage,
          files,
        }),
      ).unwrap()

      if (socketRef.current) {
        socketRef.current.emit('newMessage', {
          content: sentMessage.content,
          images: sentMessage.images,
          senderId: user.id,
          receiverId: selectedReceiverId,
          timestamp: sentMessage.timestamp,
        })
      }

      setMessageText('')
      attachments.forEach((attachment) => URL.revokeObjectURL(attachment.preview))
      setAttachments([])
      setShowEmojiPicker(false)
      dispatch(fetchRecentChats(user.id))
    } catch {
      // Error already handled in slice state
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/60 p-4 md:p-6">
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => dispatch(clearMessengerError())}
            className="font-semibold hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="grid min-h-0 flex-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:grid-cols-[360px_1fr]">
        <MessengerSidebar
          activeTab={activeTab}
          chats={filteredChats}
          contacts={filteredContacts}
          loadingChats={loadingChats}
          loadingContacts={loadingContacts}
          searchValue={searchValue}
          selectedReceiverId={selectedReceiverId}
          onSearchChange={setSearchValue}
          onTabChange={(tab) => dispatch(setActiveMessengerTab(tab))}
          onReceiverSelect={handleReceiverSelect}
        />

        <div className="relative flex min-h-0 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <ChatHeader receiver={selectedReceiver} loading={loadingReceiver} />
          <MessageList
            currentUserId={user?.id || ''}
            loading={loadingMessages}
            messages={messages}
          />
          <MessageComposer
            attachments={attachments}
            disabled={!selectedReceiverId || sendingMessage}
            messageText={messageText}
            showEmojiPicker={showEmojiPicker}
            onAttachmentChange={handleAttachmentChange}
            onEmojiSelect={(emoji) => setMessageText((currentText) => `${currentText}${emoji}`)}
            onMessageChange={setMessageText}
            onRemoveAttachment={handleRemoveAttachment}
            onSend={handleSendMessage}
            onToggleEmojiPicker={() => setShowEmojiPicker((currentValue) => !currentValue)}
          />
        </div>
      </section>
    </div>
  )
}

export default Messenger
