# Booking Flow Notes

This document explains how the reusable booking screens are connected in this repo so another developer can debug or extend them safely.

## Files That Matter

- `src/pages/pms/pms-booking.jsx`
  Reusable booking workspace UI.
- `src/pages/pms/panel-booking.jsx`
  Wrapper page for panel-source bookings.
- `src/pages/admin/hotel-bookings.jsx`
  Wrapper page for admin all-bookings view.
- `redux/slices/pms/bookings.js`
  Shared Redux slice for booking lists, booking detail, filters, and updates.
- `src/App.jsx`
  Route registration and route-guard exceptions for booking pages.
- `src/api.js`
  Shared axios client with auth/global loader behavior.

## Current Booking Pages

### 1. PMS partner bookings

- Route: `/your-bookings`
- Component: `src/pages/pms/pms-booking.jsx`
- Fetch mode: `partner`
- Main API:
  `GET /partner/:partnerId/hotel-bookings`

This page is partner/user scoped and uses the logged-in user id.

### 2. Panel bookings

- Route: `/panel-booking`
- Component: `src/pages/pms/panel-booking.jsx`
- Wrapper over reusable `PmsBooking`
- Fetch mode: `query`
- Fixed filter:
  `bookingSource=Panel`
- Main API:
  `GET /get/all/filtered/booking/by/query?bookingSource=Panel`

### 3. Admin hotel bookings

- Route: `/hotel-bookings`
- Component: `src/pages/admin/hotel-bookings.jsx`
- Wrapper over reusable `PmsBooking`
- Fetch mode: `query`
- Main API:
  `GET /get/all/filtered/booking/by/query`

This page is intended to load all bookings initially, then apply admin filters.

## Shared UI Component

`src/pages/pms/pms-booking.jsx` is no longer just a PMS page. It is the shared booking workspace component.

It accepts props:

- `title`
  Page heading.
- `subtitle`
  Optional descriptive text under the title.
- `fetchMode`
  `partner` or `query`.
- `fixedFilters`
  Filters always forced into requests.
- `hideSourceFilter`
  Useful when source is already fixed, like panel bookings.
- `showPartnerIdentity`
  Whether to show partner/user identity in header.
- `extraFilterFields`
  Extra text filters used by admin all-bookings page.

## Redux Slice Responsibilities

`redux/slices/pms/bookings.js` owns:

- list filters
- bookings list
- derived hotels list
- summary counts
- selected booking detail
- loading states
- booking update state

Important state keys:

- `filters`
- `bookings`
- `hotels`
- `summary`
- `selectedBooking`
- `loading`
- `detailLoading`
- `detailError`
- `updatingBooking`
- `error`

### Why `error` and `detailError` are separate

`error` is for page-level fetch/update problems.
`detailError` is for booking-detail lookup problems.

This split was added because detail fetch failures were showing a top-level red banner even when the row snapshot fallback was enough to render the modal.

## API Wiring

### A. Partner bookings fetch

Thunk:
`fetchPartnerHotelBookings`

API:
`GET /partner/:partnerId/hotel-bookings`

Used by:
- `/your-bookings`

### B. Generic filtered bookings fetch

Thunk:
`fetchBookingsByQuery`

API:
`GET /get/all/filtered/booking/by/query`

Supported filter keys in current slice:

- `hotelId`
- `bookingStatus`
- `bookingSource`
- `date`
- `userId`
- `bookingId`
- `hotelEmail`
- `hotelCity`
- `couponCode`
- `createdBy`

Used by:
- `/panel-booking`
- `/hotel-bookings`

### C. Booking detail fetch

Thunk:
`fetchBookingById`

Primary API:
`GET /booking/:bookingId`

Fallback API:
`GET /get/all/filtered/booking/by/query?bookingId=...`

Reason for fallback:
Some environments/responses were inconsistent for the direct booking endpoint, so the UI falls back to query lookup before showing "not found".

Important:
This flow must use `bookingId`, not Mongo `_id`.

### D. Booking update

Thunk:
`updateBookingData`

API:
`PUT /updatebooking/:bookingId`

Important backend behavior:

- request is auth protected
- fields in body are directly `$set`
- certain statuses trigger notifications
- cancelled booking lock exists for non-Admin/non-Developer users

### E. Cancel reason rule

Reusable edit modal enforces:

- if `bookingStatus === 'Cancelled'`
- then `cancellationReason` is required

Payload example:

```json
{
  "bookingStatus": "Cancelled",
  "cancellationReason": "Customer requested cancellation"
}
```

Because edit UI is shared, this rule currently applies to:

- PMS bookings
- panel bookings
- admin hotel bookings

## List Loading Flow

### Partner mode

1. reusable component mounts
2. `fetchMode === 'partner'`
3. logged-in user id is read from auth slice
4. `fetchPartnerHotelBookings({ partnerId, filters })`
5. list, hotels, and summary are hydrated from backend response

### Query mode

1. reusable component mounts
2. `fetchMode === 'query'`
3. `fetchBookingsByQuery({ filters, fixedFilters })`
4. bookings are fetched from generic query API
5. summary and hotel cards are derived client-side from the bookings array

## View/Edit Modal Flow

### View

1. row button passes the full booking row
2. component extracts `booking.bookingId`
3. row is stored in `activeBookingRow` as fallback
4. `fetchBookingById(bookingId)` runs
5. modal renders `selectedBooking || activeBookingRow`

This fallback is important because it prevents blank modals when detail fetch is slow or partially unavailable.

### Edit

1. row button passes full booking row
2. `bookingId` is extracted
3. detail fetch runs
4. modal allows updating `bookingStatus`, `pm`
5. if cancelled, `cancellationReason` becomes mandatory
6. `updateBookingData({ bookingId, updateData })`
7. page list is refreshed using the same fetch mode and active filters

## Role-Based Detail Visibility

Inside booking detail modal:

- `Admin` and `Developer`
  see expanded booking details
- all other roles
  see reduced essential details only

This is controlled in `pms-booking.jsx` using:

- `privilegedRoles`
- `isPrivilegedUser`

## Sticky Layout Behavior

Reusable booking page currently handles:

- fixed sidebar
- sticky top header
- sticky booking page intro block
  breadcrumb + title + sync button + tabs

If sticky breaks again, inspect:

- `src/components/header.jsx`
- `src/components/sidebar.jsx`
- the outer shell in `src/pages/pms/pms-booking.jsx`

The booking shell must remain:

- `flex h-screen overflow-hidden`
- content column with `h-screen`
- inner `main` as the scroll container

## Route Guard Behavior

Routes are protected using `allowedRoutes` derived from sidebar links.

Some booking routes were added manually to avoid them being blocked when backend sidebar config had not yet been seeded.

See:
`src/App.jsx`

Static allowed routes currently include:

- `/hotel-bookings`
- `/panel-booking`

## Common Bugs And Where To Check

### 1. "Booking details not found"

Check:

- row has a real `bookingId`
- handler is passing booking row, not `_id`
- `fetchBookingById` fallback logic in slice
- backend `GET /booking/:bookingId`
- fallback query API response shape

### 2. Top red error banner appears during modal view

Check:

- `detailError` vs `error`
- do not write detail fetch failures into page-level `error`

### 3. Page stops being sticky

Check:

- `Header` still has sticky classes
- booking page shell still uses `h-screen`
- sticky page intro block still exists in shared booking page

### 4. Admin filters not working

Check:

- keys are present in `initialFilters`
- filter input names match backend query keys
- `fetchBookingsByQuery` passes merged filters correctly

### 5. Panel bookings showing wrong source

Check:

- wrapper `src/pages/pms/panel-booking.jsx`
- `fixedFilters = { bookingSource: 'Panel' }`
- `hideSourceFilter`

## Safe Extension Pattern

If a new booking page is needed:

1. create a thin wrapper page
2. reuse `PmsBooking`
3. decide `fetchMode`
4. pass `fixedFilters`
5. pass optional `extraFilterFields`
6. add route in `src/App.jsx`
7. if needed, add route to static allowed routes until backend sidebar config is updated

Example shape:

```jsx
import PmsBooking from '../pms/pms-booking'

function ExampleBookingPage() {
  return (
    <PmsBooking
      title="Example Bookings"
      fetchMode="query"
      fixedFilters={{ bookingSource: 'Site' }}
    />
  )
}
```

## Assumptions In Current Implementation

- generic query API may return arrays in multiple response shapes, so slice normalizes several possibilities
- some booking summary cards for query pages are derived client-side from booking rows
- room table always uses `roomDetails`
- non-admin users should not see expanded internal/admin-only booking details
- update calls should continue to use `bookingId`

## Quick Debug Checklist

- Route works in `src/App.jsx`
- Page wrapper exists and points to reusable component
- Fetch mode is correct
- Filters are in slice initial state
- API thunk is being called
- Response normalization is correct
- `selectedBooking` or row fallback exists
- page-level `error` is not being polluted by detail lookup failures
