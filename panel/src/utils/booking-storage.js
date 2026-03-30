const BOOKING_GUEST_STORAGE_KEY = 'bookingCreation:selectedGuest'
const BOOKING_HOTEL_STORAGE_KEY = 'bookingCreation:selectedHotel'

const canUseStorage = () => typeof window !== 'undefined'

export const saveSelectedGuest = (guest) => {
  if (!canUseStorage() || !guest) {
    return
  }

  window.sessionStorage.setItem(BOOKING_GUEST_STORAGE_KEY, JSON.stringify(guest))
}

export const getSelectedGuest = () => {
  if (!canUseStorage()) {
    return null
  }

  const storedValue = window.sessionStorage.getItem(BOOKING_GUEST_STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    window.sessionStorage.removeItem(BOOKING_GUEST_STORAGE_KEY)
    return null
  }
}

export const saveSelectedHotel = (hotel) => {
  if (!canUseStorage() || !hotel) {
    return
  }

  window.sessionStorage.setItem(BOOKING_HOTEL_STORAGE_KEY, JSON.stringify(hotel))
}

export const getSelectedHotel = () => {
  if (!canUseStorage()) {
    return null
  }

  const storedValue = window.sessionStorage.getItem(BOOKING_HOTEL_STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    window.sessionStorage.removeItem(BOOKING_HOTEL_STORAGE_KEY)
    return null
  }
}

export const clearSelectedHotel = () => {
  if (!canUseStorage()) {
    return
  }

  window.sessionStorage.removeItem(BOOKING_HOTEL_STORAGE_KEY)
}
