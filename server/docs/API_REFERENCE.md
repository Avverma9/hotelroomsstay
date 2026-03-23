# Hotel Stay Server — API Reference

**Base URL:** `http://localhost:5000`

---

## Table of Contents

1. [Complaints API](#1-complaints-api)
2. [Hotel Availability API](#2-hotel-availability-api)
3. [Hotel Update API](#3-hotel-update-api)
4. [Bulk Hotel Management API](#4-bulk-hotel-management-api)
5. [Monthly Price API](#5-monthly-price-api)

---

## 1. Complaints API

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/create-a-complaint/on/hotel` | Naya complaint banao |
| `GET` | `/get/all-complaint-on-admin/panel` | Saare complaints (admin) |
| `GET` | `/complaint/by-id/:id` | Single complaint by `_id` |
| `GET` | `/complaints/:userId` | User ke saare complaints |
| `GET` | `/get/all-complaint-on-admin/panel/by-filter` | Filter by status/hotel |
| `PATCH` | `/approveComplaint-on-panel/by-id/:id` | Status update karo |
| `POST` | `/do/chat-support/:complaintId` | Chat message bhejo |
| `DELETE` | `/delete-a-particular/complaints/delete/by/id/:id` | Delete complaint |

---

### POST `/create-a-complaint/on/hotel`

**Content-Type:** `multipart/form-data` (supports image upload)

**Request Body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | String (ObjectId) | ✅ | User ka MongoDB `_id` |
| `hotelId` | String (ObjectId) | ✅ | Hotel ka MongoDB `_id` |
| `regarding` | String | ✅ | `Booking` \| `Hotel` \| `Website` |
| `issue` | String | ✅ | Complaint description |
| `hotelName` | String | ❌ | |
| `hotelEmail` | String | ❌ | |
| `bookingId` | String | ❌ | Related booking ID |
| `status` | String | ❌ | Default: `Pending` |
| `images` | File[] | ❌ | S3 upload — multipart only |

**Response `201`:**
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "complaintId": "12345678",
  "userId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "hotelId": "64f1a2b3c4d5e6f7a8b9c0aa",
  "regarding": "Hotel",
  "issue": "Room was not clean.",
  "status": "Pending",
  "images": [],
  "updatedBy": [],
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

**Error Responses:**
```json
// 400 — missing fields
{ "message": "Missing required fields." }

// 400 — too many pending complaints (>= 3)
{ "message": "You have too many pending complaints. Please resolve them before creating a new one." }
```

---

### GET `/get/all-complaint-on-admin/panel`

No request params.

**Response `200`:** Array of complaints with chats
```json
[
  {
    "_id": "64f1a2b3...",
    "complaintId": "12345678",
    "userId": "...",
    "regarding": "Hotel",
    "issue": "Room was not clean.",
    "status": "Pending",
    "chats": [
      {
        "complaintId": "12345678",
        "sender": "user@gmail.com",
        "receiver": "admin@hotel.com",
        "content": "Any update?",
        "timestamp": "2026-03-20T11:00:00.000Z"
      }
    ]
  }
]
```

---

### GET `/complaint/by-id/:id`

**URL Param:** `id` — MongoDB `_id` of complaint

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3...",
    "complaintId": "12345678",
    "status": "Pending",
    "chats": []
  }
}
```

---

### GET `/complaints/:userId`

**URL Param:** `userId` — User ka MongoDB `_id` string

**Response `200`:** Array of user's complaints with chats

---

### GET `/get/all-complaint-on-admin/panel/by-filter`

**Query Params (all optional):**

| Param | Example | Notes |
|-------|---------|-------|
| `status` | `Pending` | `Pending` \| `Approved` \| `Rejected` \| `Resolved` \| `Working` |
| `hotelName` | `Grand` | Case-insensitive partial match |
| `hotelEmail` | `contact@hotel.com` | Case-insensitive partial match |
| `complaintId` | `12345678` | Exact 8-digit ID |

**Example:**
```
GET /get/all-complaint-on-admin/panel/by-filter?status=Pending&hotelName=Grand
```

---

### PATCH `/approveComplaint-on-panel/by-id/:id`

**Request Body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | String | ✅ | `Pending` \| `Approved` \| `Rejected` \| `Resolved` \| `Working` |
| `updatedBy.name` | String | ✅ | Admin name |
| `updatedBy.email` | String | ✅ | Admin email |
| `feedBack` | String | ❌ | Admin feedback message |
| `messages` | String[] | ❌ | Additional messages |

```json
{
  "status": "Approved",
  "feedBack": "We are investigating your complaint.",
  "updatedBy": {
    "name": "Admin Rahul",
    "email": "admin@hotel.com"
  },
  "messages": ["We will contact you within 24 hours."]
}
```

**Response `200`:**
```json
{
  "success": true,
  "updatedComplaint": { ...complaintObject }
}
```

---

### POST `/do/chat-support/:complaintId`

**URL Param:** `complaintId` — 8-digit auto-generated complaint ID (not MongoDB `_id`)

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `sender` | String | ✅ |
| `receiver` | String | ✅ |
| `content` | String | ✅ |

```json
{
  "sender": "user@gmail.com",
  "receiver": "admin@hotel.com",
  "content": "Hello, any update on my complaint?"
}
```

**Response `201`:**
```json
{
  "_id": "...",
  "complaintId": "12345678",
  "sender": "user@gmail.com",
  "receiver": "admin@hotel.com",
  "content": "Hello, any update on my complaint?",
  "timestamp": "2026-03-20T11:00:00.000Z"
}
```

---

### DELETE `/delete-a-particular/complaints/delete/by/id/:id`

**URL Param:** `id` — MongoDB `_id` of complaint

Complaint aur uske **saare chats** bhi delete ho jaate hain.

**Response `200`:**
```json
{
  "message": "Complaint and related chats deleted successfully",
  "deletedComplaint": { ...complaintObject },
  "deletedChatsCount": 3
}
```

---

## 2. Hotel Availability API

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/check/hotels/room-availability` | Single hotel ki availability |
| `GET` | `/check/all-hotels/room-availability` | Saare hotels ki availability |

---

### GET `/check/hotels/room-availability`

**Query Params:**

| Param | Type | Required | Example |
|-------|------|----------|---------|
| `hotelId` | String | ✅ | `12345678` |
| `fromDate` | String (ISO) | ✅ | `2026-03-20` |
| `toDate` | String (ISO) | ✅ | `2026-03-25` |

**Example:**
```
GET /check/hotels/room-availability?hotelId=12345678&fromDate=2026-03-20&toDate=2026-03-25
```

**Response `200`:**
```json
{
  "hotelId": "12345678",
  "hotelName": "Grand Palace Hotel",
  "city": "Mumbai",
  "fromDate": "2026-03-20",
  "toDate": "2026-03-25",
  "totalRooms": 50,
  "listedAvailableRooms": 45,
  "activelyBlockedRooms": 10,
  "actualAvailableRooms": 35,
  "isAvailable": true,
  "bookingSummary": {
    "Confirmed": 6,
    "Checked-in": 4,
    "Checked-out": 2,
    "Pending": 0,
    "No-Show": 0,
    "Cancelled": 3,
    "Failed": 0
  }
}
```

**Error Responses:**
```json
// 400
{ "error": "hotelId, fromDate and toDate are required." }
{ "error": "Invalid date format. Use ISO 8601 (YYYY-MM-DD)." }
{ "error": "toDate must be after fromDate." }

// 404
{ "error": "Hotel not found." }
```

---

### GET `/check/all-hotels/room-availability`

**Query Params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `fromDate` | String (ISO) | ✅ | `2026-03-20` |
| `toDate` | String (ISO) | ✅ | `2026-03-25` |
| `city` | String | ❌ | Case-sensitive — `Mumbai` |

**Example:**
```
GET /check/all-hotels/room-availability?fromDate=2026-03-20&toDate=2026-03-25&city=Mumbai
```

**Response `200`:** Array of hotels
```json
[
  {
    "hotelId": "12345678",
    "hotelName": "Grand Palace Hotel",
    "city": "Mumbai",
    "fromDate": "2026-03-20",
    "toDate": "2026-03-25",
    "totalRooms": 50,
    "listedAvailableRooms": 45,
    "activelyBlockedRooms": 10,
    "actualAvailableRooms": 35,
    "bookedBeforeListing": 5,
    "isAvailable": true,
    "note": null,
    "bookingSummary": {
      "Confirmed": 6,
      "Checked-in": 4,
      "Checked-out": 2,
      "Pending": 0,
      "No-Show": 0,
      "Cancelled": 3,
      "Failed": 0
    },
    "bookings": [
      {
        "bookingId": "BK-2024-001",
        "customerName": "Rahul Sharma",
        "checkInDate": "2026-03-21",
        "checkOutDate": "2026-03-23",
        "numRooms": 2,
        "bookingStatus": "Confirmed"
      }
    ]
  }
]
```

### Availability Fields Explained

| Field | Meaning |
|-------|---------|
| `totalRooms` | Hotel mein total registered rooms |
| `listedAvailableRooms` | Owner ne jo available mark kiye |
| `activelyBlockedRooms` | Is date range mein blocked rooms (Confirmed + Checked-in + Pending + No-Show) |
| `actualAvailableRooms` | `listedAvailableRooms - activelyBlockedRooms` |
| `bookedBeforeListing` | `totalRooms - listedAvailableRooms` |
| `isAvailable` | `true` agar `actualAvailableRooms > 0` |

---

## 3. Hotel Update API

### PATCH `/hotels/:hotelId`

Hotel ki basic details update karne ke liye recommended endpoint.

Legacy alias bhi available hai:
`PATCH /hotels/update/info/:hotelId`

**URL Param:** `hotelId` - hotel ka 8 digit `hotelId`

**Request Body:** All fields optional, lekin kam se kam 1 field bhejna zaroori hai.

```json
{
  "hotelName": "Grand Palace Hotel",
  "hotelOwnerName": "Aman Verma",
  "hotelEmail": "info@hotelroomsstay.com",
  "city": "Jaipur",
  "state": "Rajasthan",
  "starRating": "4",
  "propertyType": ["Hotel", "Resort"],
  "description": "Updated hotel description",
  "customerWelcomeNote": "Welcome to our hotel",
  "onFront": true,
  "isAccepted": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Hotel updated successfully",
  "data": {
    "hotelId": "12345678",
    "hotelName": "Grand Palace Hotel"
  }
}
```

**Error Responses:**
```json
// 400
{ "success": false, "message": "hotelId is required" }
{ "success": false, "message": "At least one updatable field is required" }

// 404
{ "success": false, "message": "Hotel not found" }
```

---

## 4. Bulk Hotel Management API

### 4.1 POST `/hotels/bulk`

Bulk me hotels create karne ke liye.

**Content-Type:** `application/json` ya `multipart/form-data`

**Request Body:**
```json
[
  {
    "hotelName": "Hotel One",
    "city": "Delhi",
    "state": "Delhi",
    "hotelEmail": "hotel1@example.com",
    "propertyType": ["Hotel"],
    "rooms": []
  },
  {
    "hotelName": "Hotel Two",
    "city": "Jaipur",
    "state": "Rajasthan",
    "hotelEmail": "hotel2@example.com",
    "propertyType": ["Resort"],
    "rooms": []
  }
]
```

**Response `201`:**
```json
{
  "status": true,
  "message": "Bulk hotels inserted",
  "count": 2,
  "data": []
}
```

### 4.2 PATCH `/hotels/bulk/update`

Multiple hotels ka status/basic bulk flags update karne ke liye.

Legacy alias:
`PATCH /remove-bulk-hotel-from-hotels/by-hotel/ids`

**Request Body:**
```json
{
  "hotelIds": ["12345678", "87654321"],
  "isAccepted": true,
  "onFront": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "2 hotel(s) updated successfully.",
  "matchedCount": 2,
  "modifiedCount": 2,
  "hotelIds": ["12345678", "87654321"],
  "updates": {
    "isAccepted": true,
    "onFront": false
  }
}
```

### 4.3 PATCH `/hotels/bulk/remove-coupons`

Selected hotels ke rooms se active offers/coupons remove karne ke liye.

Legacy alias:
`PATCH /remove-bulk-coupons-from-hotels/by-hotel/id`

**Request Body:**
```json
{
  "hotelIds": ["12345678", "87654321"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Active coupons and room offers removed successfully for the selected hotels.",
  "hotelIds": ["12345678", "87654321"],
  "affectedRooms": 5
}
```

### 4.4 DELETE `/hotels/bulk/delete`

Multiple hotels delete karne ke liye.

Legacy alias:
`DELETE /delete-bulk-hotels-from-list-of-hotels/by-ids`

**Request Body:**
```json
{
  "hotelIds": ["12345678", "87654321"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "2 hotel(s) deleted successfully.",
  "deletedCount": 2,
  "hotelIds": ["12345678", "87654321"]
}
```

**Common errors:**
```json
{ "message": "hotelIds must be a non-empty array." }
{ "message": "No hotels found with the provided IDs." }
```

---

## 5. Monthly Price API

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/monthly-set-room-price/:hotelId/:roomId` | Monthly price set karo |
| `GET` | `/monthly-set-room-price/get/by/:hotelId` | Hotel ki saari prices lo |
| `PATCH` | `/monthly-set-room-price/update/:id` | Price update karo |
| `DELETE` | `/monthly-set-room-price/delete/by-id/:id` | Single entry delete |
| `DELETE` | `/monthly-set-room-price/delete/price/by/:hotelId` | Hotel ki saari prices delete |

---

### POST `/monthly-set-room-price/:hotelId/:roomId`

**URL Params:** `hotelId`, `roomId`

**Request Body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `startDate` | String (ISO) | ✅ | `2026-04-01` |
| `endDate` | String (ISO) | ✅ | `2026-04-30` — must be after startDate |
| `monthPrice` | Number | ✅ | Non-negative number |

```json
{
  "startDate": "2026-04-01",
  "endDate":   "2026-04-30",
  "monthPrice": 25000
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3...",
    "hotelId": "12345678",
    "roomId": "ROOM-001",
    "startDate": "2026-04-01",
    "endDate": "2026-04-30",
    "monthPrice": 25000
  }
}
```

---

### GET `/monthly-set-room-price/get/by/:hotelId`

**URL Param:** `hotelId`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3...",
      "hotelId": "12345678",
      "roomId": "ROOM-001",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "monthPrice": 25000,
      "roomType": "Deluxe",
      "roomBedType": "King"
    }
  ]
}
```

> `roomType` and `roomBedType` hotel ke room data se merge hoti hain. `null` agar room delete ho gaya ho.

---

### PATCH `/monthly-set-room-price/update/:id`

**URL Param:** `id` — MongoDB `_id` of price entry

**Request Body (all optional):**
```json
{
  "startDate": "2026-04-05",
  "endDate":   "2026-04-30",
  "monthPrice": 22000
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { ...updatedDocument }
}
```

---

### DELETE `/monthly-set-room-price/delete/by-id/:id`

Single entry delete by MongoDB `_id`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Deleted successfully",
  "data": { ...deletedDocument }
}
```

---

### DELETE `/monthly-set-room-price/delete/price/by/:hotelId`

Hotel ki **saari** monthly price entries delete karo.

**Response `200`:**
```json
{
  "success": true,
  "message": "Deleted 3 price entries for hotel 12345678"
}
```

**Error Responses (all endpoints):**
```json
// 400
{ "error": "startDate, endDate and monthPrice are required." }
{ "error": "endDate must be after startDate." }
{ "error": "monthPrice must be a non-negative number." }

// 404
{ "error": "Monthly price entry not found." }
{ "error": "No monthly price entries found for this hotel." }
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `404` | Resource not found |
| `409` | Conflict |
| `500` | Internal server error |
