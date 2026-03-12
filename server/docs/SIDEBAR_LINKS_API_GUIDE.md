# Dynamic Sidebar Links API + Admin Panel Guide

## Base URL
`hotelroomsstay.com/api`

## Feature Goal
Dynamic sidebar links are now managed from backend using:
- `parentLink`
- `childLink`
- `isParentOnly`
- `icon`
- `status`
- `role`

This replaces old sidebar navlink/menu-item APIs.

## Data Model
```json
{
  "_id": "67c80e44170bb367bdf95c17",
  "parentLink": "Bookings",
  "childLink": "/dashboard/bookings",
  "isParentOnly": false,
  "icon": "MdOutlineHotel",
  "status": "active",
  "role": ["Admin", "PMS"],
  "order": 1,
  "createdAt": "2026-03-05T10:00:00.000Z",
  "updatedAt": "2026-03-05T10:00:00.000Z"
}
```

## API Endpoints

### 1) Create Single Sidebar Link
- Method: `POST`
- URL: `/additional/sidebar-links`

#### Request Payload
```json
{
  "parentLink": "Bookings",
  "childLink": "/dashboard/bookings",
  "isParentOnly": false,
  "icon": "MdOutlineHotel",
  "status": "active",
  "role": ["Admin", "PMS"],
  "order": 1
}
```

`childLink` ke place par `route` bhi bhej sakte ho:
```json
{
  "parentLink": "Dashboard",
  "route": "/dashboard",
  "isParentOnly": true,
  "icon": "MdSpaceDashboard",
  "status": "active",
  "role": ["Admin"],
  "order": 1
}
```

Parent-only with no route bhi bana sakte ho:
```json
{
  "parentLink": "Reports",
  "isParentOnly": true,
  "icon": "MdAssessment",
  "status": "active",
  "role": ["Admin"],
  "order": 2
}
```
In this case backend `childLink` ko `"#"` set karta hai.

#### Response Payload (201)
```json
{
  "message": "Sidebar link created successfully",
  "data": {
    "_id": "67c80e44170bb367bdf95c17",
    "parentLink": "Bookings",
    "childLink": "/dashboard/bookings",
    "isParentOnly": false,
    "icon": "MdOutlineHotel",
    "status": "active",
    "role": ["Admin", "PMS"],
    "order": 1
  }
}
```

### 2) Create Sidebar Links in Bulk
- Method: `POST`
- URL: `/additional/sidebar-links/bulk`

#### Request Payload
```json
[
  {
    "parentLink": "Dashboard",
    "childLink": "/dashboard/home",
    "isParentOnly": false,
    "icon": "MdSpaceDashboard",
    "status": "active",
    "role": ["Admin"],
    "order": 1
  },
  {
    "parentLink": "Users",
    "childLink": "/dashboard/users",
    "icon": "MdPeople",
    "status": "active",
    "role": ["Admin", "PMS"],
    "order": 2
  }
]
```

#### Response Payload (201)
```json
{
  "message": "Sidebar links created successfully",
  "data": [
    { "...": "created item 1" },
    { "...": "created item 2" }
  ]
}
```

### 3) Get Sidebar Links (Flat List)
- Method: `GET`
- URL: `/additional/sidebar-links?role=Admin&status=active`

#### Query Params
- `role` (optional): filters links where role array contains value
- `status` (optional): `active` or `inactive`

#### Response Payload (200)
```json
{
  "message": "Sidebar links fetched successfully",
  "data": [
    {
      "_id": "67c80e44170bb367bdf95c17",
      "parentLink": "Bookings",
      "childLink": "/dashboard/bookings",
      "icon": "MdOutlineHotel",
      "status": "active",
      "role": ["Admin", "PMS"],
      "order": 1
    }
  ]
}
```

### 4) Get Sidebar Links Grouped by Parent
- Method: `GET`
- URL: `/additional/sidebar-links/grouped?role=Admin`

#### Response Payload (200)
```json
{
  "message": "Sidebar links grouped by parentLink",
  "data": {
    "Dashboard": [
      {
        "id": "67c80e44170bb367bdf95c10",
        "childLink": "/dashboard/home",
        "route": "/dashboard/home",
        "isParentOnly": false,
        "icon": "MdSpaceDashboard",
        "status": "active",
        "role": ["Admin"],
        "order": 1
      }
    ],
    "Users": [
      {
        "id": "67c80e44170bb367bdf95c11",
        "childLink": "/dashboard/users",
        "icon": "MdPeople",
        "status": "active",
        "role": ["Admin", "PMS"],
        "order": 2
      }
    ]
  }
}
```

### 5) Update Sidebar Link
- Method: `PUT`
- URL: `/additional/sidebar-links/:id`

#### Request Payload (any updatable fields)
```json
{
  "parentLink": "Users Management",
  "route": "/users/manage",
  "isParentOnly": true,
  "icon": "MdManageAccounts",
  "role": ["Admin"],
  "order": 3
}
```

#### Response Payload (200)
```json
{
  "message": "Sidebar link updated successfully",
  "data": {
    "_id": "67c80e44170bb367bdf95c17",
    "parentLink": "Users Management",
    "childLink": "/users/manage",
    "isParentOnly": true,
    "icon": "MdManageAccounts",
    "status": "active",
    "role": ["Admin"],
    "order": 3
  }
}
```

### 6) Change Status
- Method: `PATCH`
- URL: `/additional/sidebar-links/:id/status`

#### Request Payload
```json
{
  "status": "inactive"
}
```

#### Response Payload (200)
```json
{
  "message": "Sidebar link status changed to inactive",
  "data": {
    "_id": "67c80e44170bb367bdf95c17",
    "status": "inactive"
  }
}
```

### 7) Delete Sidebar Link
- Method: `DELETE`
- URL: `/additional/sidebar-links/:id`

#### Response Payload (200)
```json
{
  "message": "Sidebar link deleted successfully"
}
```

## Admin Panel Integration Guide

### 1) Sidebar Setup Flow
1. Admin logs in and gets role (`Admin`, `PMS`, etc.).
2. Frontend calls `GET /additional/sidebar-links/grouped?role=<loggedInRole>`.
3. Render groups by `parentLink`.
4. Render each child node using:
   - label/group: `parentLink`
   - route: `childLink`
   - icon: `icon`
5. Render only `status=active` links for panel navigation.

### 2) Admin CRUD Screen (Recommended)
Create one "Sidebar Links Management" page with:
- Table columns: `parentLink`, `childLink`, `icon`, `status`, `role`, `order`
- Filters: `role`, `status`
- Actions: Create, Edit, Change Status, Delete

### 3) Form Validation Rules
- `parentLink`: required
- `childLink`: required only when `isParentOnly=false` (or not passed)
- `isParentOnly`: optional boolean (`true` means this link can act as parent-only item)
- `role`: at least one role required
- `status`: `active` or `inactive`
- `order`: optional integer

### 4) Suggested Frontend Payload Mapping
- Parent menu label -> `parentLink`
- Child route path -> `childLink`
- Icon key/class -> `icon`
- Toggle switch -> `status`
- Multi-select roles -> `role` (array)
- Sort position -> `order`

## User Permission APIs (Dynamic Sidebar)

### 1) Get sidebar for specific user (effective)
- Method: `GET`
- URL: `/additional/sidebar-links/for-user/:userId?grouped=true`

This API returns final sidebar for user after applying:
- role-based links
- allowed overrides
- blocked overrides

### 2) Get user permission config
- Method: `GET`
- URL: `/additional/sidebar-permissions/:userId`

### 3) Replace full user permission config
- Method: `PUT`
- URL: `/additional/sidebar-permissions/:userId`

#### Request Payload
```json
{
  "mode": "custom",
  "allowedLinkIds": ["67c80e44170bb367bdf95c10", "67c80e44170bb367bdf95c11"],
  "blockedLinkIds": []
}
```

`mode` values:
- `role_based`: role ke hisab se links + allowed extra - blocked
- `custom`: only allowed links - blocked

### 4) Add allowed links for user
- Method: `PATCH`
- URL: `/additional/sidebar-permissions/:userId/allow`

#### Request Payload
```json
{
  "linkIds": ["67c80e44170bb367bdf95c10", "67c80e44170bb367bdf95c11"]
}
```

### 5) Add blocked links for user
- Method: `PATCH`
- URL: `/additional/sidebar-permissions/:userId/block`

#### Request Payload
```json
{
  "linkIds": ["67c80e44170bb367bdf95c22"]
}
```

## Sidebar Usage Flow (Production)

1. Admin creates sidebar menus via:
- `POST /additional/sidebar-links`
- or `POST /additional/sidebar-links/bulk`

2. Admin assigns user permission mode:
- `PUT /additional/sidebar-permissions/:userId`

3. Admin custom allow/block updates:
- `PATCH /additional/sidebar-permissions/:userId/allow`
- `PATCH /additional/sidebar-permissions/:userId/block`

4. Frontend render for any user:
- `GET /additional/sidebar-links/for-user/:userId?grouped=true`

5. Login-based rendering (already supported):
- `POST /login/dashboard/user`
- response contains `sidebarLinks` (effective, permission-aware)

## Admin Login + LocalStorage Flow

### 1) Dashboard Login
- Method: `POST`
- URL: `/login/dashboard/user`

#### Request Payload
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

#### Response Payload (200)
```json
{
  "message": "Logged in as",
  "loggedUserRole": "Admin",
  "loggedUserStatus": true,
  "loggedUserImage": ["https://..."],
  "loggedUserId": "67c80e44170bb367bdf95c17",
  "loggedUserName": "Super Admin",
  "loggedUserEmail": "admin@example.com",
  "rsToken": "jwt-token",
  "sidebarLinks": {
    "Dashboard": [
      {
        "id": "67c80e44170bb367bdf95c10",
        "childLink": "/dashboard/home",
        "icon": "MdSpaceDashboard",
        "status": "active",
        "role": ["Admin"],
        "order": 1
      }
    ]
  },
  "sessionData": {
    "token": "jwt-token",
    "tokenType": "Bearer",
    "expiresIn": "24h",
    "user": {
      "id": "67c80e44170bb367bdf95c17",
      "role": "Admin",
      "status": true,
      "name": "Super Admin",
      "email": "admin@example.com",
      "image": ["https://..."]
    },
    "sidebarLinks": {
      "Dashboard": [{ "id": "67c80e44170bb367bdf95c10", "childLink": "/dashboard/home" }]
    }
  }
}
```

### 2) Save Session in localStorage (Frontend Example)
```js
const response = await axios.post("/login/dashboard/user", payload);
const session = response.data.sessionData;

localStorage.setItem("adminSession", JSON.stringify(session));
localStorage.setItem("adminToken", session.token);
localStorage.setItem("adminUser", JSON.stringify(session.user));
localStorage.setItem("adminSidebar", JSON.stringify(session.sidebarLinks));
```

### 3) Forgot Password
- Method: `POST`
- URL: `/forgot-password/dashboard/user`

#### Request Payload
```json
{
  "email": "admin@example.com"
}
```

### 4) Change Password
- Method: `POST`
- URL: `/change-password/dashboard/user`

#### Request Payload
```json
{
  "email": "admin@example.com",
  "otp": "123456",
  "newPassword": "newStrongPassword123"
}
```

## Booking + Coupon APIs For Sidebar Modules

### A) Hotel Booking APIs

#### 1) Create hotel booking
- Method: `POST`
- URL: `/booking/:userId/:hotelId`

#### Request Payload
```json
{
  "checkInDate": "2026-03-20",
  "checkOutDate": "2026-03-22",
  "guests": 2,
  "guestDetails": [{ "name": "Amit", "age": 28 }],
  "numRooms": 1,
  "roomDetails": [{ "roomId": "R101", "type": "Deluxe", "price": 2500 }],
  "foodDetails": [{ "name": "Breakfast", "price": 200, "quantity": 2 }],
  "couponCode": "ABC123",
  "discountPrice": 500,
  "bookingStatus": "Pending",
  "pm": "UPI",
  "bookingSource": "App",
  "hotelName": "Hotel Prime",
  "hotelEmail": "hotel@example.com",
  "hotelCity": "Jaipur",
  "hotelOwnerName": "Owner Name",
  "destination": "Jaipur"
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "bookingId": "ABCD123XYZ",
    "price": 4700,
    "gstPrice": 12,
    "gstAmount": 450
  }
}
```

#### 2) Update booking status/info
- Method: `PUT`
- URL: `/updatebooking/:bookingId`

#### 3) User booking list
- Method: `GET`
- URL: `/get/all/users-filtered/booking/by?userId=123456&page=1&limit=10`

#### 4) Admin booking list
- Method: `GET`
- URL: `/get/all/filtered/booking/by/query`

### B) Travel Booking APIs

#### 1) Create travel booking
- Method: `POST`
- URL: `/travel/create-travel/booking`

#### Request Payload
```json
{
  "userId": "123456",
  "carId": "67c90bc5f4aa8b740fbd8621",
  "seats": ["67c90bc5f4aa8b740fbd8628"],
  "customerMobile": "9999999999",
  "customerEmail": "user@example.com"
}
```

#### Response (201)
```json
{
  "success": true,
  "message": "Booking successful",
  "data": {
    "bookingId": "TRV123456",
    "bookingStatus": "Pending",
    "price": 980
  }
}
```

#### 2) Change booking status
- Method: `PATCH`
- URL: `/travel/change-booking-status/:id`
- Body: `{ "bookingStatus": "Confirmed" }`

#### 3) Get all travel bookings
- Method: `GET`
- URL: `/travel/get-travels-bookings`

#### 4) Update travel booking
- Method: `PATCH`
- URL: `/travel/update-travel/booking`
- Body:
```json
{
  "id": "67c90bc5f4aa8b740fbd9999",
  "data": {
    "bookingStatus": "Cancelled"
  }
}
```

### C) Tour APIs + Tour Booking APIs

#### 1) Create tour package
- Method: `POST`
- URL: `/create-tour`

#### 2) Get tours
- Method: `GET`
- URL: `/get-tour-list`

#### 3) Create tour booking
- Method: `POST`
- URL: `/tour-booking/create-tour-booking`

#### Request Payload
```json
{
  "userId": "123456",
  "tourId": "67d001122334455667788990",
  "vehicleId": "67d001122334455667788991",
  "seats": ["1A", "1B"],
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "tax": 100,
  "discount": 50
}
```

#### Response (201)
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingCode": "TOURX12345",
    "status": "pending",
    "totalAmount": 4050
  }
}
```

#### 4) Get all tour bookings
- Method: `GET`
- URL: `/tour-booking/get-bookings`

#### 5) Get tour bookings by user
- Method: `GET`
- URL: `/tour-booking/get-users-booking?userId=123456`

#### 6) Get single tour booking by identifier
- Method: `GET`
- URL: `/tour-booking/get-users-booking/by/:bookingId`
- Supports both Mongo `_id` and `bookingCode`

#### 7) Update tour booking
- Method: `PATCH`
- URL: `/tour-booking/update-tour-booking/:bookingId`

#### 8) Delete tour booking
- Method: `PATCH`
- URL: `/tour-booking/delete-tour-booking/:bookingId`
- Supports both Mongo `_id` and `bookingCode`

### D) Unified Coupon APIs (Single Model)

All coupon APIs now run on one model with `type`:
- `hotel`
- `partner`
- `user`

#### Unified coupon fields
```json
{
  "couponCode": "728193",
  "type": "user",
  "couponName": "WELCOME50",
  "discountPrice": 50,
  "validity": "2026-03-31T23:59:59.000Z",
  "quantity": 1,
  "maxUsage": 1,
  "usedCount": 0,
  "expired": false,
  "assignedTo": "user@example.com",
  "targetUserId": "23533101",
  "roomId": [],
  "hotelId": [],
  "usageHistory": []
}
```

#### 1) Hotel coupon create/apply/list
- Create: `POST /coupon/create-a-new/coupon`
- Apply: `PATCH /apply/a/coupon-to-room`
- List active: `GET /coupon/get/all`
- List valid (applied): `GET /valid-coupons`

#### 2) Partner coupon create/apply/list
- Create: `POST /partner-coupon/coupon/create-a-new/coupon`
- Apply: `PATCH /partner-coupon/apply/a/coupon-to-room`
- List: `GET /partner-coupon/coupon/get/all`

#### 3) User coupon create/apply/list
- Create: `POST /user-coupon/coupon/create-a-new/coupon/user`
- Apply: `PATCH /user-coupon/apply/a/coupon-to-room/user`
- List: `GET /user-coupon/coupon/get/all/user`
- Default coupon by email: `POST /user-coupon/get-default-coupon/user`

#### 4) Generic coupon listing by type/status/search
- Method: `GET`
- URL: `/coupon/get/by-type?type=user&status=active&search=welcome`
- `type`: `hotel | partner | user`
- `status`: `active | expired | all`

#### Create Coupon Request Payload
```json
{
  "couponName": "SUMMER50",
  "discountPrice": 500,
  "validity": "2026-06-30T23:59:59.000Z",
  "quantity": 100,
  "maxUsage": 100
}
```

#### Apply Coupon Request Payload (hotel/partner)
```json
{
  "couponCode": "SUMMER50",
  "hotelIds": ["H1001", "H1002"],
  "roomIds": ["R101", "R201"]
}
```

#### Apply User Coupon Request Payload
```json
{
  "couponCode": "WELCOME50",
  "hotelId": "H1001",
  "roomId": "R101",
  "userId": "23533101"
}
```

#### Legacy data migration (one time)
If old data exists in `UserCoupon` / `PartnerCoupon` collections, run:
```bash
npm run migrate:coupons
```
This will copy legacy coupons into unified `Coupon` model with correct `type`.

### E) Full Filter API Index (State/City/Name/Role/Status)

#### Hotel filters
- `GET /see-all/hotels-state/get/all/hotels`  
  Returns all available hotel states.
- `GET /see-all/hotels-city/get/city?state=Rajasthan`  
  Returns cities for selected state.
- `GET /get-hotels-all/city`  
  Returns all accepted hotel cities.
- `GET /hotels/filters?...`  
  Advanced hotel filter (main site).  
  Query params:  
  `search`, `starRating`, `propertyType`, `localId`, `latitude`, `longitude`, `countRooms`, `hotelCategory`, `type`, `bedTypes`, `amenities`, `unmarriedCouplesAllowed`, `minPrice`, `maxPrice`, `checkInDate`, `checkOutDate`, `guests`, `page`, `limit`
- `GET /hotels/query/get/by?...`  
  Admin hotel query filter.  
  Query params: `amenities`, `bedTypes`, `starRating`, `propertyType`, `hotelOwnerName`, `hotelEmail`, `roomTypes`

#### Tour filters
- `GET /filter-tour/by-query?...`  
  Query params:  
  `q`, `country`, `state`, `city`, `themes`, `amenities`, `amenitiesMode`, `fromWhere`, `to`, `minPrice`, `maxPrice`, `minNights`, `maxNights`, `minRating`, `nights`, `price`, `starRating`, `fromDate`, `toDate`, `startDate`, `endDate`, `isCustomizable`, `hasImages`, `hasVehicles`, `page`, `limit`, `sortBy`, `sortOrder`
- `GET /search-tours/from-to?from=Delhi&to=Manali`
- `GET /tours/visiting-places`
- `GET /sort-tour/by-price?minPrice=1000&maxPrice=5000`
- `GET /sort-tour/by-duration?minNights=2&maxNights=5`
- `GET /sort-tour/by-themes?themes=Adventure`

#### Travel filters
- `GET /travel/filter-car/by-query?...`  
  Query params: `make`, `model`, `vehicleNumber`, `fuelType`, `seater`, `pickupP`, `dropP`, `pickupD`, `dropD`
- `POST /travel/get-bookings-by/bookedBy` (body with `customerMobile`)
- `GET /travel/get-bookings-by/user/:userId`
- `GET /travel/get-bookings-by/owner/:ownerId`

#### Booking filters
- `GET /get/all/users-filtered/booking/by?userId=...&bookingStatus=...&page=1&limit=10`
- `GET /get/all/filtered/booking/by/query?...`  
  Query params: `bookingStatus`, `userId`, `bookingId`, `hotelEmail`, `date`, `hotelCity`, `couponCode`, `createdBy`

#### User and partner filters
- `GET /get/user/by/query?mobile=...&email=...`
- `GET /api/users-get-user/by/query?search=...`  
  Supports role/email/mobile/name/city based partner search.

#### Sidebar filters
- `GET /additional/sidebar-links?role=Admin&status=active`
- `GET /additional/sidebar-links/grouped?role=Admin`

## Removed Old Sidebar APIs
The following old navlink/menu routes are removed:
- `POST /additional/bulk-add-menuItems`
- `POST /additional/add-single/menu`
- `GET /additional/get-menu-items`
- `PATCH /additional/change-menu/status/:id`
- `DELETE /additional/delete-menu-item/:id`
- `POST /api/users/:id/menu-items`
- `PATCH /api/users/:id/menu-items`
- `PATCH /api/users/delete-all-menu-items/:id`
