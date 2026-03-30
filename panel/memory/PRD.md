# HRS Admin Panel - PRD

## Original Problem Statement
1. pages/admin/tour-list me sare tour ko get karna hai table me dikhana hai update, view karna hai uske liye slice tms/tour me hai
2. Master filter laagana hai - tour-list aur /tours-book dono pages me
3. fetchFilteredTours slice ka use karna hai with query params: q, country, state, city, from, themes, amenities, amenitiesMode, fromWhere, to, visitingPlace, visitingPlaces, minPrice, maxPrice, minNights, maxNights, minRating, nights, price, starRating, fromDate, toDate, startDate, endDate, agencyEmail, isCustomizable, hasImages, hasVehicles, page, limit, sortBy, sortOrder, runningStatus
4. Hotel edit page ke bugs fix karo - data save nahi ho raha tha
5. tour-list.jsx route = "/tour-list", tour-request.jsx route = "/tour-request"

## User Personas
- Admin: Full access to tour management, hotel management, approvals
- Tour Operators: Can view their own tours
- Regular Users: Can browse and book tours

## Core Requirements (Static)
- Tour list management with table view
- Master filter with all query parameters
- Tour request approval/rejection system
- Hotel edit functionality with room management

## What's Been Implemented (Jan 2026)

### Tour Management
1. **Tour List Page** (`/tour-list`)
   - Table view with all tours
   - View and Edit action buttons
   - Master filter sidebar with all query params
   - Pagination support
   - Uses `getAllTours` and `fetchFilteredTours` slices

2. **Tour Request Page** (`/tour-request`)
   - Shows pending tour requests
   - Approve/Reject functionality
   - Filter tabs (All, Pending, Approved, Rejected)
   - Stats cards showing counts
   - Uses `getRequestedTours` and `updateTour` slices

3. **Tour Slice Updates**
   - Added `getAllTours` thunk for `/get-all-tours` API
   - Added `allTours` state

### Hotel Edit Bug Fixes
1. **normalizeRoom function** - Fixed to handle both string and array formats for amenities/images
2. **buildRoomEntry function** - Fixed array handling for amenities/images
3. **saveRoomLocal function** - Fixed to preserve roomId when editing existing rooms

### Files Modified/Created
- `/app/src/pages/admin/tour-list.jsx` (NEW)
- `/app/src/pages/tour-request.jsx` (NEW)
- `/app/redux/slices/tms/travel/tour/tour.js` (MODIFIED - added getAllTours)
- `/app/src/pages/admin/hotel/hotel-edit.jsx` (MODIFIED - bug fixes)
- `/app/src/routes/app-routes.jsx` (MODIFIED - added routes)

## Routes Added
- `/tour-list` → TourListPage
- `/tour-request` → TourRequestPage

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (High)
- Add tour delete functionality (if needed in future)
- Add bulk actions for tours

### P2 (Medium)
- Export tours to CSV/Excel
- Advanced search with date range picker
- Tour analytics dashboard

## Next Tasks
1. Test all pages with admin credentials
2. Add more filter options if needed
3. Optimize table performance for large datasets
