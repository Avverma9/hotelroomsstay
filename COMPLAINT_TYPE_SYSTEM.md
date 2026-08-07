# Complaint Type System Implementation

## Overview
Implemented a dual complaint system with **User Complaints** (users file for themselves) and **Admin Complaints** (admins/developers file on behalf of any user).

---

## Backend Changes

### 1. Complaint Model (`server/models/complaints/complaint.js`)
**Added Fields:**
- `complaintType`: enum ['User', 'Admin'], default 'User'
- `createdBy`: ObjectId reference to `dashboardUsers` (stores who created the complaint for admin complaints)

**Schema Changes:**
```javascript
complaintType: {
  type: String,
  enum: ['User', 'Admin'],
  default: 'User',
  required: true,
},
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'dashboardUsers',
  required: false,
}
```

### 2. Complaint Controller (`server/controllers/complaints/complaint.js`)
**Updated `createComplaint`:**
- Accepts `complaintType` parameter ('User' or 'Admin')
- Accepts `createdById` parameter (logged-in admin's ID for Admin complaints)
- Validates `complaintType` (must be 'User' or 'Admin')
- Stores `createdBy` field for Admin complaints
- Defaults to 'User' type if not specified

**Updated `filteredComplaints`:**
- Added `complaintType` filter parameter
- Allows filtering complaints by type (User/Admin)

---

## Frontend Changes

### 1. New Selection Page (`panel/src/pages/admin/file-complaint-selection.jsx`)
**Features:**
- Shows both "User Complaint" and "Admin Complaint" options
- **Role-based access control**: Admin Complaint button only visible to Admin and Developer roles
- Beautiful card-based UI with icons and descriptions
- Shows current user's role at the bottom

**Access Control:**
```javascript
const normalizedRole = String(user?.role || '').toLowerCase()
const isAdminOrDeveloper = normalizedRole === 'admin' || normalizedRole === 'developer'
```

### 2. User Complaint Component (`panel/src/components/complaints/create-user-complaint.jsx`)
**Features:**
- Simple form without user selection dropdown
- Uses logged-in user's ID automatically
- Sets `complaintType: 'User'`
- All fields same as before (regarding, issue, hotel details, booking ID)
- Footer shows: "Filing complaint for yourself as: [Current User]"

### 3. Admin Complaint Component (`panel/src/components/complaints/create-complaint.jsx`)
**Updated Features:**
- Includes user selection dropdown (required)
- Shows all users with name, email, and mobile
- Sets `complaintType: 'Admin'`
- Sets `createdById` to logged-in admin's ID
- Footer shows: "Filing complaint as admin for: [Selected User]"
- Changed header to "Admin Complaint" with different icon

**Payload sent:**
```javascript
{
  userId: selectedUserId,  // Selected user's ID
  regarding: 'Hotel',
  issue: 'Description...',
  complaintType: 'Admin',
  createdById: user._id,   // Logged-in admin's ID
  // ... other optional fields
}
```

### 4. Routes Updated (`panel/src/routes/app-routes.jsx`)
**New Routes:**
- `/file-complaint` → `FileComplaintSelection` (shows both options)
- `/complaint/user/create` → `CreateUserComplaint` (User Complaint form)
- `/complaint/admin/create` → `CreateAdminComplaint` (Admin Complaint form)

**Removed:**
- Old `/complaint/create` route (replaced with specific routes)

---

## User Flow

### User Complaint Flow (All Users):
1. User clicks "File Complaint" in menu
2. Redirected to `/file-complaint` selection page
3. Clicks "User Complaint" card
4. Form opens with no user selection (uses logged-in user)
5. Fills regarding, issue, optional fields
6. Submits → complaint created with `complaintType: 'User'`

### Admin Complaint Flow (Admin/Developer Only):
1. Admin clicks "File Complaint" in menu
2. Redirected to `/file-complaint` selection page
3. **Sees both "User Complaint" and "Admin Complaint" cards**
4. Clicks "Admin Complaint" card
5. Form opens with **user selection dropdown** at top
6. Admin selects user from list
7. Fills regarding, issue, optional fields
8. Submits → complaint created with:
   - `complaintType: 'Admin'`
   - `userId`: selected user's ID
   - `createdBy`: admin's ID

---

## Role-Based Access Control

### Who Can Access What:
| Feature | All Users | Admin | Developer |
|---------|-----------|-------|-----------|
| User Complaint Form | ✅ | ✅ | ✅ |
| Admin Complaint Form | ❌ | ✅ | ✅ |
| Admin Complaint Button | Hidden | Visible | Visible |

### Implementation:
```javascript
const normalizedRole = String(user?.role || '').toLowerCase()
const isAdminOrDeveloper = normalizedRole === 'admin' || normalizedRole === 'developer'

{isAdminOrDeveloper && <AdminComplaintCard />}
```

---

## API Endpoints

### Create Complaint
**Endpoint:** `POST /api/complaints`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "regarding": "Hotel",
  "issue": "Room was not clean",
  "complaintType": "Admin",  // NEW: 'User' or 'Admin'
  "createdById": "507f1f77bcf86cd799439022",  // NEW: Admin's ID
  "hotelName": "Hotel Gandhi",
  "hotelEmail": "contact@hotelgandhi.com",
  "hotelId": "507f1f77bcf86cd799439033",
  "bookingId": "BK-2024-001"
}
```

### Filter Complaints
**Endpoint:** `GET /api/complaints/filter`

**Query Parameters:**
- `status`: Pending, Approved, Rejected, Resolved, Working
- `complaintType`: User, Admin (NEW)
- `hotelName`: Hotel name (case-insensitive)
- `hotelEmail`: Hotel email (case-insensitive)
- `complaintId`: Complaint ID

**Example:**
```
GET /api/complaints/filter?complaintType=Admin&status=Pending
```

---

## Database Changes

### Before:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  complaintId: "12345678",
  regarding: "Hotel",
  issue: "...",
  status: "Pending",
  // ... other fields
}
```

### After:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  complaintId: "12345678",
  regarding: "Hotel",
  issue: "...",
  status: "Pending",
  complaintType: "Admin",  // NEW
  createdBy: ObjectId,     // NEW (dashboard user who created it)
  // ... other fields
}
```

---

## Testing Checklist

### User Complaint:
- [ ] Regular user can access `/file-complaint`
- [ ] User can see "User Complaint" card
- [ ] User cannot see "Admin Complaint" card
- [ ] Form uses logged-in user's ID
- [ ] Complaint created with `complaintType: 'User'`
- [ ] No `createdBy` field in database

### Admin Complaint:
- [ ] Admin can access `/file-complaint`
- [ ] Admin can see both complaint cards
- [ ] Admin Complaint form shows user dropdown
- [ ] Dropdown populated with all users
- [ ] Form validation requires user selection
- [ ] Complaint created with `complaintType: 'Admin'`
- [ ] `userId` field contains selected user's ID
- [ ] `createdBy` field contains admin's ID

### Access Control:
- [ ] Non-admin users don't see Admin Complaint option
- [ ] Admin and Developer roles can access Admin Complaint
- [ ] Direct navigation to `/complaint/admin/create` blocked for non-admins (depends on route permissions)

### API:
- [ ] Create complaint API accepts `complaintType` parameter
- [ ] Create complaint API accepts `createdById` parameter
- [ ] Filter API supports `complaintType` query parameter
- [ ] Invalid `complaintType` returns 400 error

---

## Next Steps (Optional Enhancements)

1. **Add complaint list filtering UI:**
   - Add "Type" filter dropdown in complaints list page
   - Show "User" or "Admin" badge on each complaint card

2. **Add "Created By" info display:**
   - Show who created the complaint in complaint details
   - For Admin complaints, show: "Created by [Admin Name] for [User Name]"

3. **Add analytics:**
   - Count User vs Admin complaints
   - Show in dashboard: "X User Complaints, Y Admin Complaints"

4. **Add permissions check:**
   - Server-side validation to ensure only Admin/Developer can create Admin complaints
   - Check `createdById` user's role before allowing Admin complaint creation

5. **Add audit log:**
   - Track when Admin created complaint for which user
   - Add timestamp and reason fields

---

## Files Modified

### Server:
- `server/models/complaints/complaint.js` (schema update)
- `server/controllers/complaints/complaint.js` (controller logic)

### Panel:
- `panel/src/components/complaints/create-complaint.jsx` (renamed to Admin Complaint)
- `panel/src/components/complaints/create-user-complaint.jsx` (NEW - User Complaint)
- `panel/src/pages/admin/file-complaint-selection.jsx` (NEW - Selection page)
- `panel/src/routes/app-routes.jsx` (route updates)

---

## Summary

✅ **Implemented dual complaint system**
✅ **Role-based access control (Admin/Developer only for Admin Complaints)**
✅ **User Complaint: Simple form for logged-in user**
✅ **Admin Complaint: Admin selects any user to file for**
✅ **Backend validation and filtering support**
✅ **Beautiful selection UI with role visibility**
✅ **Proper tracking with `complaintType` and `createdBy` fields**

The system is now complete and ready for testing!
