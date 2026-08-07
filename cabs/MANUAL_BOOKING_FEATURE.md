# Manual Booking Feature - Seat Management

## Overview
Owner/Rider ab manually seat ko "Booked" mark kar sakta hai with full customer details. Proper booking create hogi with customer information.

---

## Changes Made

### 1. Booking Form Modal Added

**Features:**
- ✅ Customer Name (Required)
- ✅ Mobile Number (Required, 10 digits)
- ✅ Email (Optional)
- ✅ Pickup Location (Optional)
- ✅ Drop Location (Optional)

### 2. Workflow

**Before:**
```
User toggles switch → Seat marked booked → No booking created ❌
```

**After:**
```
User toggles switch → Modal opens → Fill customer details → Create booking → Seat marked booked ✅
```

### 3. Validation

**Required Fields:**
- Customer Name (must not be empty)
- Mobile Number (must be 10 digits)

**Optional Fields:**
- Email
- Pickup Location
- Drop Location

---

## User Flow

### Step 1: Toggle Free Seat to Booked
```
User clicks on "Free" toggle for an available seat
↓
Booking modal opens
```

### Step 2: Fill Customer Details
```
Modal shows form with fields:
- Customer Name *
- Mobile Number *
- Email
- Pickup Location
- Drop Location

User fills required details
```

### Step 3: Create Booking
```
User clicks "Create Booking" button
↓
Validation runs
↓
If valid:
  - API call to create booking (TODO: implement)
  - Seat marked as booked
  - Modal closes
  - Success message shown

If invalid:
  - Error alert shown
  - User stays on modal
```

### Step 4: Booked Seat Protection
```
Once seat is booked:
- Toggle becomes DISABLED
- Cannot be unmarked as available
- Shows in red with "Booked" label
```

---

## Technical Implementation

### State Added
```typescript
const [bookingModalVisible, setBookingModalVisible] = useState(false);
const [selectedSeatForBooking, setSelectedSeatForBooking] = useState<Seat | null>(null);
const [bookingForm, setBookingForm] = useState({
  customerName: "",
  customerMobile: "",
  customerEmail: "",
  pickupLocation: "",
  dropLocation: "",
});
```

### Handler Functions

**1. handleToggleBooking(seat: Seat)**
```typescript
- Checks if seat is already booked
- If not booked:
  - Opens modal
  - Resets form
  - Sets selected seat
```

**2. handleCreateBooking()**
```typescript
- Validates customer name (required)
- Validates mobile (10 digits)
- Calls API to create booking (TODO)
- Updates seat status to booked
- Closes modal
- Shows success message
```

---

## API Integration (TODO)

### Endpoint to Implement
```
POST /api/bookings/manual

Body:
{
  "carId": "car123",
  "seatId": "seat456",
  "customerName": "John Doe",
  "customerMobile": "9876543210",
  "customerEmail": "john@example.com",
  "pickupLocation": "Airport",
  "dropLocation": "Hotel"
}

Response:
{
  "success": true,
  "bookingId": "booking789",
  "message": "Booking created successfully"
}
```

### Backend Changes Needed

**1. Create Manual Booking Controller**
```javascript
// server/controllers/booking/manualBooking.js
exports.createManualBooking = async (req, res) => {
  const { carId, seatId, customerName, customerMobile, customerEmail, pickupLocation, dropLocation } = req.body;
  
  // Validate required fields
  if (!customerName || !customerMobile) {
    return res.status(400).json({ message: "Customer name and mobile are required" });
  }
  
  // Create booking with status "Confirmed"
  const booking = await Booking.create({
    carId,
    seatId,
    customerName,
    customerMobile,
    customerEmail,
    pickupLocation,
    dropLocation,
    bookingType: "Manual",
    status: "Confirmed",
    paymentStatus: "Pending"
  });
  
  // Update seat status to booked
  await updateSeatStatus(seatId, { isBooked: true, bookingId: booking._id });
  
  return res.status(201).json({
    success: true,
    bookingId: booking._id,
    message: "Booking created successfully"
  });
};
```

**2. Add Route**
```javascript
// server/routes/booking.js
router.post('/manual', auth, createManualBooking);
```

---

## UI/UX

### Modal Design
- Full-screen overlay with semi-transparent background
- White card with rounded corners
- Header with title and close button
- Scrollable form body
- Footer with Cancel and Create buttons

### Form Layout
```
┌─────────────────────────────┐
│ Create Booking          ✕   │
├─────────────────────────────┤
│ Seat: 1 · Window           │
│                             │
│ Customer Name *             │
│ [________________]          │
│                             │
│ Mobile Number *             │
│ [________________]          │
│                             │
│ Email (Optional)            │
│ [________________]          │
│                             │
│ Pickup Location (Optional)  │
│ [________________]          │
│                             │
│ Drop Location (Optional)    │
│ [________________]          │
│                             │
├─────────────────────────────┤
│ [Cancel] [Create Booking]   │
└─────────────────────────────┘
```

### Color Scheme
- **Available Seat**: Green (#059669)
- **Booked Seat**: Red (#DC2626)
- **Primary Button**: Blue (colors.primary)
- **Modal Background**: White (colors.surface)

---

## Validation Rules

### Customer Name
- ✅ Must not be empty
- ✅ Trimmed before validation

### Mobile Number
- ✅ Must be exactly 10 digits
- ✅ Numeric only
- ✅ No special characters allowed

### Email (Optional)
- ⚠️ No validation currently
- 💡 Recommendation: Add email format validation

---

## Error Handling

### Validation Errors
```typescript
Alert.alert("Validation Error", "Please enter customer name");
Alert.alert("Validation Error", "Please enter valid 10-digit mobile number");
```

### API Errors
```typescript
Alert.alert("Error", "Failed to create booking. Please try again.");
```

### Success Message
```typescript
Alert.alert("Success", "Booking created successfully");
```

---

## Security Considerations

### Access Control
- Only authenticated riders/owners can create manual bookings
- Verify ownership of car before allowing booking creation

### Data Validation
- Server-side validation for all fields
- Sanitize inputs to prevent SQL injection
- Rate limiting to prevent spam bookings

---

## Testing Checklist

### Functional Testing
- [ ] Modal opens when toggling free seat
- [ ] Modal closes on Cancel button
- [ ] Modal closes on X button
- [ ] Form fields accept input
- [ ] Validation shows error for empty name
- [ ] Validation shows error for invalid mobile
- [ ] Booking creates successfully with valid data
- [ ] Seat updates to "Booked" after booking
- [ ] Booked seat toggle is disabled

### Edge Cases
- [ ] Try booking already booked seat (should not open modal)
- [ ] Submit form with only spaces in name (should fail)
- [ ] Enter mobile with < 10 digits (should fail)
- [ ] Enter mobile with > 10 digits (should be limited to 10)
- [ ] Network failure during booking (should show error)
- [ ] Close app during booking creation (should handle gracefully)

---

## Future Enhancements

### Phase 2
1. **Payment Integration**
   - Add payment amount field
   - Collect payment via UPI/Card
   - Update payment status

2. **Booking Management**
   - View booking details
   - Edit booking
   - Cancel booking
   - Mark as completed

3. **Notifications**
   - SMS to customer with booking details
   - Email confirmation
   - WhatsApp notification

4. **Advanced Features**
   - Multiple seat booking in one flow
   - Discount/Coupon application
   - Special requests field
   - Recurring bookings

---

## Summary

✅ **Modal-based booking form** added
✅ **Customer details collection** (name, mobile, email, locations)
✅ **Form validation** implemented
✅ **Booked seat protection** (toggle disabled)
✅ **Error handling** with alerts
✅ **Clean UI/UX** with modal design

🔜 **Backend API integration** pending
🔜 **Payment collection** future scope
🔜 **Booking management** future scope

Now owner can manually create bookings with proper customer information! 🎉
