import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Car, Clock, Save, X as XIcon } from 'lucide-react'

/**
 * Car Availability Calendar Component
 * Shows monthly view with booked dates and allows date selection/update
 * Now supports manual availability blocking (like mobile app)
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CarAvailabilityCalendar = ({
  carId,
  carName = 'Vehicle',
  ownerId, // NEW: Owner ID for availability updates
  bookings = [], // Array of bookings: { _id, bookingId, pickupD, dropD, bookingStatus, ... }
  ownerAvailability = [], // NEW: Array of owner-blocked dates
  onDateClick,
  onDateRangeSelect,
  onAvailabilityUpdate, // NEW: Callback when owner blocks/unblocks dates
  selectedDates = [],
  mode = 'view', // 'view' | 'select' | 'block' | 'edit'
  className = ''
}) => {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [editMode, setEditMode] = useState(false) // NEW: Toggle edit mode
  const [saving, setSaving] = useState(false)

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      })
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      })
    }

    // Next month's leading days
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentDate])

  // Get booking status for a date (includes owner availability)
  const getDateStatus = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    
    // Check if owner has manually blocked this date
    const isOwnerBlocked = ownerAvailability.some(avail => {
      if (avail.mode !== 'unavailable') return false
      const startDate = new Date(avail.startDate).toISOString().split('T')[0]
      const endDate = new Date(avail.endDate).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate
    })

    if (isOwnerBlocked) {
      return {
        available: false,
        ownerBlocked: true,
        bookings: [],
        reason: 'Owner blocked'
      }
    }

    // Check bookings
    const bookingsOnDate = bookings.filter(booking => {
      if (!booking.pickupD || !booking.dropD) return false
      
      const pickupDate = new Date(booking.pickupD).toISOString().split('T')[0]
      const dropDate = new Date(booking.dropD).toISOString().split('T')[0]
      
      return dateStr >= pickupDate && dateStr <= dropDate
    })

    if (bookingsOnDate.length === 0) return { available: true, bookings: [], ownerBlocked: false }

    // Check if any confirmed/pending/ride-in-progress booking
    const activeBooking = bookingsOnDate.find(b => 
      ['Confirmed', 'Pending', 'Available', 'Ride in Progress'].includes(b.bookingStatus || b.status)
    )

    return {
      available: !activeBooking,
      bookings: bookingsOnDate,
      activeBooking,
      ownerBlocked: false
    }
  }

  // Check if date is selected
  const isDateSelected = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return selectedDates.some(d => {
      const selDateStr = new Date(d).toISOString().split('T')[0]
      return selDateStr === dateStr
    })
  }

  // Check if date is in selection range
  const isInSelectionRange = (date) => {
    if (!selectionStart || !selectionEnd) return false
    return date >= selectionStart && date <= selectionEnd
  }

  // Handle date click (for both view and edit modes)
  const handleDateClick = (dayInfo) => {
    if (!dayInfo.isCurrentMonth) return

    if (editMode) {
      // Edit mode: Select range to block/unblock
      if (!selectionStart) {
        setSelectionStart(dayInfo.date)
        setSelectionEnd(null)
      } else if (!selectionEnd) {
        if (dayInfo.date >= selectionStart) {
          setSelectionEnd(dayInfo.date)
        } else {
          setSelectionEnd(selectionStart)
          setSelectionStart(dayInfo.date)
        }
      } else {
        // Reset selection
        setSelectionStart(dayInfo.date)
        setSelectionEnd(null)
      }
    } else if (mode === 'select' && onDateRangeSelect) {
      // Range selection mode
      if (!selectionStart) {
        setSelectionStart(dayInfo.date)
        setSelectionEnd(null)
      } else if (!selectionEnd) {
        if (dayInfo.date >= selectionStart) {
          setSelectionEnd(dayInfo.date)
          onDateRangeSelect({ start: selectionStart, end: dayInfo.date })
        } else {
          // User clicked earlier date, swap
          setSelectionEnd(selectionStart)
          setSelectionStart(dayInfo.date)
          onDateRangeSelect({ start: dayInfo.date, end: selectionStart })
        }
      } else {
        // Reset selection
        setSelectionStart(dayInfo.date)
        setSelectionEnd(null)
      }
    } else if (onDateClick) {
      // Single date click
      const status = getDateStatus(dayInfo.date)
      onDateClick(dayInfo.date, status)
    }
  }

  // Save availability update
  const handleSaveAvailability = async (makeAvailable) => {
    if (!selectionStart || !selectionEnd) {
      alert('Please select start and end dates')
      return
    }

    if (!onAvailabilityUpdate) {
      alert('Availability update handler not provided')
      return
    }

    setSaving(true)
    try {
      await onAvailabilityUpdate({
        startDate: selectionStart.toISOString(),
        endDate: selectionEnd.toISOString(),
        mode: makeAvailable ? 'available' : 'unavailable',
        carId,
        ownerId
      })
      
      // Reset selection
      setSelectionStart(null)
      setSelectionEnd(null)
      setEditMode(false)
    } catch (error) {
      console.error('Failed to update availability:', error)
      alert('Failed to update availability. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  // Get day cell class
  const getDayCellClass = (dayInfo) => {
    const status = getDateStatus(dayInfo.date)
    const isToday = dayInfo.date.toDateString() === today.toDateString()
    const isSelected = isDateSelected(dayInfo.date)
    const inRange = isInSelectionRange(dayInfo.date)
    const isPast = dayInfo.date < today && dayInfo.date.toDateString() !== today.toDateString()

    let classes = 'relative flex h-14 w-full flex-col items-center justify-center rounded-lg transition-all cursor-pointer hover:ring-2 hover:ring-indigo-300'

    if (!dayInfo.isCurrentMonth) {
      classes += ' text-slate-300 bg-slate-50/30 cursor-not-allowed'
    } else if (isPast) {
      classes += ' text-slate-400 bg-slate-50'
    } else if (status.ownerBlocked) {
      // Owner manually blocked
      classes += ' bg-gray-200 text-gray-700 ring-1 ring-gray-400'
    } else if (!status.available) {
      // Booking exists
      classes += ' bg-rose-100 text-rose-700 ring-1 ring-rose-300'
    } else if (isSelected || inRange) {
      classes += ' bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400'
    } else {
      classes += ' bg-emerald-50 text-slate-700 hover:bg-emerald-100'
    }

    if (isToday) {
      classes += ' ring-2 ring-indigo-500 font-bold'
    }

    return classes
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Calendar size={20} className="text-indigo-500" />
            {carName} Availability
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          {onAvailabilityUpdate && ownerId && (
            <button
              onClick={() => {
                setEditMode(!editMode)
                setSelectionStart(null)
                setSelectionEnd(null)
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                editMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {editMode ? '✓ Edit Mode' : 'Edit Availability'}
            </button>
          )}
          
          <button
            onClick={goToToday}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToNextMonth}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Edit Mode Instructions */}
      {editMode && (
        <div className="mb-4 rounded-lg bg-indigo-50 p-4 ring-1 ring-indigo-200">
          <h4 className="mb-2 text-sm font-bold text-indigo-900">Edit Mode Active</h4>
          <p className="text-xs text-indigo-700">
            Click on a start date, then click on an end date to select a range.
            Then choose to mark dates as Available or Unavailable.
          </p>
        </div>
      )}

      {/* Selection Info & Actions */}
      {selectionStart && editMode && (
        <div className="mb-4 space-y-3 rounded-lg bg-indigo-50 p-4 ring-1 ring-indigo-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-700">
              {selectionEnd
                ? `Selected: ${selectionStart.toLocaleDateString()} - ${selectionEnd.toLocaleDateString()}`
                : `Start: ${selectionStart.toLocaleDateString()} (Click end date)`}
            </p>
            <button
              onClick={clearSelection}
              className="rounded p-1 text-indigo-600 hover:bg-indigo-100"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          {selectionEnd && (
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveAvailability(false)}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={14} />
                    Mark Unavailable
                  </>
                )}
              </button>
              <button
                onClick={() => handleSaveAvailability(true)}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={14} />
                    Mark Available
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Normal Selection Info (non-edit mode) */}
      {selectionStart && !editMode && mode === 'select' && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 p-3 ring-1 ring-indigo-200">
          <p className="text-sm font-semibold text-indigo-700">
            {selectionEnd
              ? `Selected: ${selectionStart.toLocaleDateString()} - ${selectionEnd.toLocaleDateString()}`
              : `Start: ${selectionStart.toLocaleDateString()} (Click end date)`}
          </p>
          <button
            onClick={clearSelection}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Clear
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-100">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-50">
          {DAYS.map((day) => (
            <div key={day} className="border-b border-r border-slate-100 p-2 text-center last:border-r-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((dayInfo, index) => {
            const status = getDateStatus(dayInfo.date)
            const dayNum = dayInfo.date.getDate()

            return (
              <div
                key={index}
                onClick={() => handleDateClick(dayInfo)}
                className={`border-b border-r border-slate-100 p-1 last:border-r-0 ${
                  index >= calendarDays.length - 7 ? 'border-b-0' : ''
                }`}
              >
                <div className={getDayCellClass(dayInfo)}>
                  {/* Day number */}
                  <span className="text-sm font-bold">{dayNum}</span>

                  {/* Status indicator */}
                  {dayInfo.isCurrentMonth && (
                    <div className="mt-0.5 flex gap-1">
                      {!status.available && (
                        <div className="h-1 w-1 rounded-full bg-rose-500" />
                      )}
                      {status.bookings.length > 1 && (
                        <span className="text-[9px] font-bold text-rose-600">
                          {status.bookings.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-200" />
          <span className="font-medium text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300" />
          <span className="font-medium text-slate-600">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-gray-200 ring-1 ring-gray-400" />
          <span className="font-medium text-slate-600">Owner Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-indigo-100 ring-2 ring-indigo-400" />
          <span className="font-medium text-slate-600">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-slate-50 ring-1 ring-slate-200" />
          <span className="font-medium text-slate-600">Past</span>
        </div>
      </div>

      {/* Bookings on selected date */}
      {mode === 'view' && selectionStart && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <h4 className="mb-2 text-sm font-bold text-slate-700">
            Bookings on {selectionStart.toLocaleDateString()}
          </h4>
          {(() => {
            const status = getDateStatus(selectionStart)
            if (status.bookings.length === 0) {
              return <p className="text-xs text-slate-500">No bookings on this date</p>
            }
            return (
              <div className="space-y-2">
                {status.bookings.map((booking, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold text-slate-700">
                          {booking.bookingId || booking._id}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {new Date(booking.pickupD).toLocaleString()} →{' '}
                          {new Date(booking.dropD).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ['Confirmed', 'Available', 'Ride in Progress'].includes(
                            booking.bookingStatus || booking.status
                          )
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {booking.bookingStatus || booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default CarAvailabilityCalendar
