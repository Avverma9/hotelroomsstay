# 📋 Booking Business Rules & Logic

Complete documentation of all booking rules, status transitions, and automated processes.

---

## 🎯 Core Business Rules

### 1. Room & Night Limits

| Criteria | Limit | Status | Action |
|----------|-------|--------|--------|
| Rooms | ≤ 3 | **Confirmed** | Automatic approval |
| Rooms | > 3 | **Pending** | Manual review required |
| Nights | ≤ 3 | **Confirmed** | Automatic approval |
| Nights | > 3 | **Pending** | Manual review required |

**Example:**
- 2 rooms for 2 nights → ✅ **Confirmed**
- 4 rooms for 2 nights → ⏳ **Pending**
- 2 rooms for 5 nights → ⏳ **Pending**

---

### 2. Duplicate Booking Detection

System checks for existing active bookings using the same **mobile number** or **email**.

| Condition | Status | Reason |
|-----------|--------|--------|
| Same mobile/email + **Different city** | **Confirmed** | Different destination, allowed |
| Same mobile/email + **Same city** + Different hotel | **Pending** | Potential duplicate, needs verification |
| Same mobile/email + Same city + **Same hotel** | **Confirmed** | Genuine rebooking |

**Active Bookings** = Bookings with status: `Confirmed`, `Pending`, `Checked-in`

---

### 3. Payment Timeout (Variable)

Payment window depends on how far in advance the booking is made:

| Booking Made | Payment Window | Auto-cancel After |
|--------------|----------------|-------------------|
| **5-7 days** before check-in | 48 hours | 48 hours |
| **2-3 days** before check-in | 24 hours | 24 hours |
| **1 day** before check-in | 6 hours | 6 hours |

**Example Timeline:**

```
Booking for March 10 (Check-in)
├─ Booked on March 3 (7 days before)
│  └─ Payment timeout: March 5, 11:59 PM (48 hours)
│
├─ Booked on March 8 (2 days before)
│  └─ Payment timeout: March 9, 11:59 PM (24 hours)
│
└─ Booked on March 9 (1 day before)
   └─ Payment timeout: March 9, 6:00 PM (6 hours)
```

If payment is not completed within the timeout period, the booking is **auto-cancelled** and rooms are released back to inventory.

---

### 4. No-Show Logic

| Condition | Status Change | Trigger |
|-----------|---------------|---------|
| Booking status = `Confirmed` | → `No-Show` | Customer doesn't check-in by check-in date |
| Check-in date passed | → `No-Show` | Automated (runs every 10 minutes) |

**Example:**
- Booking: March 10 check-in
- Customer doesn't check-in by March 10, 11:59 PM
- System automatically marks as **No-Show** on March 11

---

## 👥 User Roles & Permissions

### Hotel Partners

**Allowed Actions:**
- ✅ `Confirmed` → `Checked-in`
- ✅ `Confirmed` → `No-Show`
- ✅ `Checked-in` → `Checked-out`

**NOT Allowed:**
- ❌ Cannot cancel `Confirmed` bookings
- ❌ Cannot cancel `Checked-in` bookings
- ❌ Cannot modify `Pending` bookings

**Rationale:** Hotels can only manage the check-in/check-out flow, not payment or cancellations.

---

### Admin / Developer

**Allowed Actions:**
- ✅ **All status transitions**
- ✅ Can modify cancelled bookings
- ✅ Can override any business rule
- ✅ Full system access

---

### Regular Users (Customers)

**Allowed Actions:**
- ✅ Can cancel their own `Pending` bookings
- ✅ Can cancel their own `Confirmed` bookings (via OTP verification)

**NOT Allowed:**
- ❌ Cannot modify bookings after `Checked-in`
- ❌ Cannot change status directly

---

## 🔄 Booking Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     NEW BOOKING                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────────────────┐
              │   Apply Business Rules  │
              │  • Room/Night limits    │
              │  • Duplicate check      │
              └─────────────────────────┘
                            ↓
           ┌────────────────────────────────┐
           │   Determine Initial Status     │
           └────────────────────────────────┘
                            ↓
          ┌─────────────────┴──────────────────┐
          ↓                                     ↓
    ┌──────────┐                         ┌───────────┐
    │ PENDING  │                         │ CONFIRMED │
    └──────────┘                         └───────────┘
          ↓                                     ↓
   Payment Timeout                     ┌────────┴────────┐
   (6h/24h/48h)                       ↓                  ↓
          ↓                      ┌──────────┐      ┌──────────┐
    ┌──────────┐                │ CHECKED-IN│      │ NO-SHOW  │
    │CANCELLED │                └──────────┘      └──────────┘
    └──────────┘                      ↓
                                ┌───────────┐
                                │CHECKED-OUT│
                                └───────────┘
```

---

## ⚙️ Automated Jobs

### Auto-Cancel Job

**Frequency:** Every 10 minutes

**Tasks:**
1. **Cancel Pending Bookings:** Finds all `Pending` bookings where `autoCancelAt` has passed
2. **Mark No-Show:** Finds all `Confirmed` bookings where check-in date has passed

**Actions on Auto-Cancel:**
- Update status to `Cancelled`
- Release booked rooms to inventory
- Send cancellation email
- Create in-app notification
- Log in `statusHistory`

**Actions on No-Show:**
- Update status to `No-Show`
- Mark timestamp
- Create in-app notification
- Log in `statusHistory`

**File Location:** `server/jobs/autoCancelPendingBookings.js`

---

## 🔧 Implementation Details

### Files Structure

```
server/
├── controllers/booking/
│   └── booking.js              # Main booking CRUD operations
├── models/booking/
│   └── booking.js              # Booking schema
├── routes/booking/
│   └── booking.js              # API endpoints
├── jobs/
│   └── autoCancelPendingBookings.js  # Automated jobs
├── utils/
│   └── bookingRules.js         # Business rules engine
└── docs/
    └── BOOKING_RULES.md        # This file
```

### Key Functions

**In `server/utils/bookingRules.js`:**
- `calculatePaymentTimeout()` - Calculates timeout based on check-in date
- `checkDuplicateBooking()` - Detects duplicate bookings
- `determineBookingStatus()` - Applies all business rules
- `validateStatusTransition()` - Validates role-based permissions
- `shouldMarkAsNoShow()` - Checks if booking should be No-Show

**In `server/controllers/booking/booking.js`:**
- `createBooking()` - Creates new booking with rules applied
- `updateBooking()` - Updates booking with permission checks
- `sendCancellationOtp()` - Sends OTP for user cancellation
- `verifyCancellationOtpAndCancel()` - Verifies OTP and cancels

---

## 📊 Status Definitions

| Status | Description | Can be changed to |
|--------|-------------|-------------------|
| **Pending** | Awaiting payment confirmation | Confirmed, Cancelled, Failed |
| **Confirmed** | Payment successful, booking active | Checked-in, No-Show, Cancelled* |
| **Checked-in** | Customer has checked in | Checked-out |
| **Checked-out** | Customer has checked out | *(terminal state)* |
| **No-Show** | Customer didn't check in | *(terminal state)* |
| **Cancelled** | Booking cancelled | *(terminal state)* |
| **Failed** | Payment failed | *(terminal state)* |

*\* Cancellation of Confirmed bookings requires user OTP verification*

---

## 🚀 API Examples

### Create Booking

```javascript
POST /booking/:userId/:hotelId

Body: {
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-18",
  "numRooms": 2,
  "guests": 4,
  "roomDetails": [...],
  "paymentMode": "online"
}

// System automatically:
// - Calculates nights (3 nights)
// - Checks room limit (2 rooms ≤ 3) ✅
// - Checks night limit (3 nights ≤ 3) ✅
// - Checks duplicates
// - Calculates payment timeout
// - Returns status: "Confirmed" or "Pending"
```

### Update Booking (Hotel Partner)

```javascript
PUT /updatebooking/:bookingId

Body: {
  "bookingStatus": "Checked-in"
}

// System validates:
// - Current status is "Confirmed" ✅
// - User role is "hotel_partner" ✅
// - Transition Confirmed → Checked-in is allowed ✅
// - Updates booking
```

### Cancel Booking (User)

```javascript
// Step 1: Request OTP
POST /booking/:bookingId/cancel/send-otp

// Step 2: Verify OTP and cancel
POST /booking/:bookingId/cancel/verify
Body: {
  "otp": "123456",
  "cancellationReason": "Change of plans"
}
```

---

## 📱 Notifications

Users receive notifications for:
- ✅ Booking created (Confirmed/Pending)
- ⏰ Payment reminder
- ❌ Booking auto-cancelled
- ⚠️ Booking marked as No-Show
- ✅ Booking confirmed (after payment)
- 🎉 Thank you for visit (after checkout)

---

## 🔍 Testing Scenarios

### Scenario 1: Normal Booking
- 2 rooms, 2 nights
- Payment made within timeout
- **Expected:** Confirmed → Checked-in → Checked-out

### Scenario 2: Exceeds Room Limit
- 5 rooms, 2 nights
- **Expected:** Pending (needs manual review)

### Scenario 3: Payment Timeout
- Booking made 6 days before check-in
- No payment for 48+ hours
- **Expected:** Auto-cancelled

### Scenario 4: Duplicate Booking
- Same email, same city, different hotel
- **Expected:** Pending (duplicate detected)

### Scenario 5: No-Show
- Confirmed booking
- Check-in date passes
- **Expected:** Status changed to No-Show

---

## 🛠️ Troubleshooting

### Booking stuck in Pending
**Check:**
1. Is `autoCancelAt` in the future?
2. Has payment been processed?
3. Are there any pending rule violations?

### Cannot update booking status
**Check:**
1. User role and permissions
2. Current booking status
3. Attempted status transition validity

### Auto-cancel not working
**Check:**
1. Is cron job running? (Check server logs)
2. Is `autoCancelAt` properly set?
3. Check for any errors in job execution

---

## 📞 Support

For questions or issues related to booking logic:
1. Check this documentation
2. Review server logs in `server/index.js`
3. Inspect booking record in database
4. Review `statusHistory` field for transition details

---

**Last Updated:** 2024
**Version:** 2.0
**Maintained by:** Development Team
