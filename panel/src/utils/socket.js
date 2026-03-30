import { io } from 'socket.io-client'
import { baseURL } from '../../util/util'

export const createMessengerSocket = ({ userId, onMessage, onStatusUpdate }) => {
  const socket = io(baseURL, {
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    socket.emit('registerUser', userId)
    socket.emit('userStatus', {
      senderId: userId,
      isOnline: true,
    })
  })

  socket.on('newMessage', (payload) => {
    onMessage?.(payload)
  })

  socket.on('userStatusUpdate', (payload) => {
    onStatusUpdate?.(payload)
  })

  return socket
}

export const disconnectMessengerSocket = (socket, userId) => {
  if (!socket) {
    return
  }

  if (socket.connected) {
    socket.emit('userStatus', {
      senderId: userId,
      isOnline: false,
    })
  }

  socket.disconnect()
}
