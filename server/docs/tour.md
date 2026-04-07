# Tour & Tour Booking API Docs

Base URL: `hotelroomsstay.com/api`

All endpoints in this document are mounted under `/tour`.

Full base path:

```
hotelroomsstay.com/api/tour
```

---

## General Notes

- `tourId`, `vehicleId`, `bookingId` — MongoDB ObjectId hote hain
- Date fields ISO format mein bhejo: `2026-04-10T08:00:00.000Z`
- Tour create/update `multipart/form-data` use karta hai (images ke liye)
- Baaki sab endpoints `application/json` use karte hain
- `isAccepted: false` wale tours public listing mein nahi aate — sirf admin dekhta hai
- Tour booking status values: `pending`, `confirmed`, `cancelled`, `failed`

---

## Common Object Shapes

### Vehicle Object (Tour ke andar)

```json
{
  "_id": "vehicle_objectid",
  "name": "Volvo AC Bus",
  "vehicleNumber": "DL01AB1234",
  "totalSeats": 40,
  "seaterType": "2x2",
  "seatConfig": {
    "rows": 10,
    "left": 2,
    "right": 2,
    "aisle": true
  },
  "seatLayout": ["1A","1B","1C","1D","2A","2B"],
  "bookedSeats": ["1A","1B"],
  "pricePerSeat": 500,
  "isActive": true
}
```

### Tour Object

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "travelAgencyName": "Sai Tours",
  "agencyEmail": "sai@tours.com",
  "agencyPhone": "9876543210",
  "isAccepted": true,
  "country": "India",
  "state": "UP",
  "city": "Varanasi",
  "visitngPlaces": "2N Varanasi | 1N Prayagraj | 2N Ayodhya",
  "themes": "Spiritual",
  "price": 8000,
  "nights": 5,
  "days": 6,
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-16T00:00:00.000Z",
  "tourStartDate": "2026-04-10T00:00:00.000Z",
  "tourEndDate": "2026-04-16T00:00:00.000Z",
  "runningStatus": "upcoming",
  "route": "Varanasi->Prayagraj->Ayodhya",
  "starRating": 4,
  "isCustomizable": false,
  "amenities": ["WiFi", "Breakfast"],
  "inclusion": ["Hotel", "Transport"],
  "exclusion": ["Flights", "Personal expenses"],
  "dayWise": [
    { "day": 1, "description": "Arrival in Varanasi, Ganga Aarti" },
    { "day": 2, "description": "Kashi Vishwanath Temple" }
  ],
  "termsAndConditions": {
    "cancellation": "50% refund if cancelled 7 days before",
    "checkin": "Check-in at 12 PM"
  },
  "vehicles": [],
  "images": ["https://cdn.example.com/tours/varanasi.jpg"],
  "createdAt": "2026-03-01T10:00:00.000Z"
}
```

### Booking Object

```json
{
  "_id": "booking_objectid",
  "bookingCode": "AB12CD34EF",
  "userId": "USR-1001",
  "tourId": "664f1a2b3c4d5e6f7a8b9c0d",
  "vehicleId": "vehicle_objectid",
  "seats": ["1A", "1B"],
  "status": "pending",
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "passengers": [
    { "type": "adult", "fullName": "Rahul Sharma", "gender": "male", "dateOfBirth": "1995-06-15T00:00:00.000Z" },
    { "type": "adult", "fullName": "Priya Sharma", "gender": "female", "dateOfBirth": "1997-03-20T00:00:00.000Z" }
  ],
  "travelAgencyName": "Sai Tours",
  "agencyEmail": "sai@tours.com",
  "country": "India",
  "city": "Varanasi",
  "visitngPlaces": "2N Varanasi | 1N Prayagraj",
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-16T00:00:00.000Z",
  "tourStartDate": "2026-04-10T00:00:00.000Z",
  "nights": 5,
  "days": 6,
  "basePrice": 8000,
  "seatPrice": 1000,
  "tax": 450,
  "discount": 0,
  "totalAmount": 9450,
  "payment": {
    "provider": "",
    "mode": "online",
    "orderId": "",
    "phonepeOrderId": "",
    "paymentId": "",
    "isPaid": false,
    "paidAt": null,
    "collectedBy": ""
  },
  "bookingSource": "app",
  "isCustomizable": false,
  "createdAt": "2026-04-06T10:00:00.000Z"
}
```

---

## Tour APIs

---

### 1. Get All Tours (Paginated)

**Method:** `GET`

**Endpoint:** `/tour/get-all-tours`

**Query Params (sab optional):**

| Param | Type | Example | Notes |
|---|---|---|---|
| `page` | Number | `1` | Default: 1 |
| `limit` | Number | `10` | Default: 10, max: 100 |
| `sortBy` | String | `price` | `createdAt`, `price`, `starRating`, `nights`, `tourStartDate` |
| `sortOrder` | String | `asc` | `asc` ya `desc` (default: `desc`) |

**Example Request:**
```
GET hotelroomsstay.com/api/tour/get-all-tours?page=1&limit=10&sortBy=price&sortOrder=asc
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* tour objects */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Filter / Search Tours

**Method:** `GET`

**Endpoint:** `/tour/filter-tour/by-query`

**Query Params (sab optional):**

| Param | Example | Notes |
|---|---|---|
| `q` | `Goa` | Keyword search (city, places, themes, agency) |
| `country` | `India` | Exact match |
| `state` | `Goa` | Exact match |
| `city` | `Panaji` | Exact match |
| `fromWhere` | `Delhi` | Pickup/starting city |
| `to` | `Goa` | Destination/visiting place |
| `visitingPlace` | `Varanasi` | Specific visiting place |
| `themes` | `Spiritual,Adventure` | Comma-separated |
| `amenities` | `WiFi,Breakfast` | Comma-separated |
| `amenitiesMode` | `all` | `all` (default) ya `any` |
| `minPrice` | `5000` | |
| `maxPrice` | `15000` | |
| `minNights` | `3` | |
| `maxNights` | `7` | |
| `minRating` | `4` | |
| `fromDate` | `2026-04-10T00:00:00.000Z` | Tour start date >= |
| `toDate` | `2026-04-30T00:00:00.000Z` | Tour start date <= |
| `runningStatus` | `upcoming` | `upcoming`, `ongoing`, `completed` |
| `isCustomizable` | `true` | |
| `hasImages` | `true` | |
| `hasVehicles` | `true` | |
| `page` | `1` | |
| `limit` | `10` | max: 50 |
| `sortBy` | `price` | |
| `sortOrder` | `asc` | |

**Example Request:**
```
GET hotelroomsstay.com/api/tour/filter-tour/by-query?fromWhere=Delhi&to=Goa&minPrice=5000&maxPrice=20000&minNights=3&sortBy=price&sortOrder=asc
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* matching tour objects */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "applied": {
    "fromWhere": "Delhi",
    "to": "Goa",
    "minPrice": 5000,
    "maxPrice": 20000
  }
}
```

---

### 3. Get Tour By ID

**Method:** `GET`

**Endpoint:** `/tour/get-tour/:id`

**Success Response `200`:**
```json
{
  "success": true,
  "data": { /* full tour object with runningStatus */ }
}
```

**Error Responses:**
```json
{ "success": false, "message": "Tour not found" }
```

---

### 4. Get All Visiting Places

**Method:** `GET`

**Endpoint:** `/tour/tours/visiting-places`

Use: Search autocomplete ke liye ya filter dropdown mein.

**Success Response `200`:**
```json
{
  "success": true,
  "data": ["Varanasi", "Prayagraj", "Ayodhya", "Goa", "Delhi"]
}
```

---

### 5. Get Vehicle Seats (Seat Picker ke liye)

**Method:** `GET`

**Endpoint:** `/tour/tours/:tourId/vehicles/:vehicleId/seats`

**Success Response `200`:**
```json
{
  "success": true,
  "vehicle": {
    "_id": "vehicle_objectid",
    "name": "Volvo AC Bus",
    "vehicleNumber": "DL01AB1234",
    "totalSeats": 40,
    "seaterType": "2x2",
    "seatConfig": { "rows": 10, "left": 2, "right": 2, "aisle": true },
    "seatLayout": ["1A","1B","1C","1D","2A","2B"],
    "seatMatrix": [
      [
        { "code": "1A", "side": "left",  "status": "booked" },
        { "code": "1B", "side": "left",  "status": "available" },
        { "type": "aisle" },
        { "code": "1C", "side": "right", "status": "available" },
        { "code": "1D", "side": "right", "status": "available" }
      ]
    ],
    "bookedSeats": ["1A"]
  }
}
```

> `status: "booked"` wali seats disabled dikhao — user select nahi kar sakta.

**Error Responses:**
```json
{ "success": false, "message": "Tour not found" }
{ "success": false, "message": "Vehicle not found" }
```

---

### 6. Get Pending Tour Requests (Admin)

**Method:** `GET`

**Endpoint:** `/tour/get-requests`

`isAccepted: false` wale tours milte hain.

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* tour objects */ ]
}
```

---

### 7. Get Tours By Owner/Agency

**Method:** `GET`

**Endpoint:** `/tour/get-tour/by-owner/query?email=agency@email.com`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* agency ke accepted tours */ ]
}
```

---

### 8. Create Tour (Admin/Agency)

**Method:** `POST`

**Endpoint:** `/tour/create-tour`

**Content-Type:** `multipart/form-data`

**Request Fields:**

| Field | Type | Notes |
|---|---|---|
| `travelAgencyName` | String | |
| `agencyEmail` | String | |
| `agencyPhone` | String | |
| `country` | String | |
| `state` | String | |
| `city` | String | Departure/base city |
| `visitngPlaces` | String | `"2N Varanasi \| 1N Prayagraj \| 2N Ayodhya"` |
| `themes` | String | |
| `price` | Number | Base package price |
| `nights` | Number | |
| `days` | Number | |
| `from` | Date String | ISO |
| `to` | Date String | ISO |
| `tourStartDate` | Date String | ISO |
| `tourEndDate` | Date String | ISO |
| `starRating` | Number | 1–5 |
| `isCustomizable` | Boolean | |
| `amenities` | JSON Array String | `'["WiFi","Breakfast"]'` |
| `inclusion` | JSON Array String | `'["Hotel","Transport"]'` |
| `exclusion` | JSON Array String | `'["Flights"]'` |
| `dayWise` | JSON Array String | `'[{"day":1,"description":"Arrival"}]'` |
| `termsAndConditions` | JSON Object String | `'{"cancellation":"50% refund"}'` |
| `vehicles` | JSON Array String | Vehicle objects array |
| `images` | File[] | |

**vehicles field example:**
```json
[
  {
    "name": "Volvo AC Bus",
    "vehicleNumber": "DL01AB1234",
    "totalSeats": 40,
    "seaterType": "2x2",
    "seatConfig": { "rows": 10, "left": 2, "right": 2, "aisle": true },
    "pricePerSeat": 500,
    "isActive": true
  }
]
```

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Tour created successfully",
  "data": { /* full tour object */ }
}
```

---

### 9. Update Tour

**Method:** `PATCH`

**Endpoint:** `/tour/update-tour/data/:id`

**Content-Type:** `application/json`

Partial update supported — sirf woh fields bhejo jo update karne hain.

Approve karne ke liye:
```json
{ "isAccepted": true }
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": { /* updated tour object */ }
}
```

---

### 10. Add Tour Images

**Method:** `PATCH`

**Endpoint:** `/tour/update-tour-image/:id`

**Content-Type:** `multipart/form-data`

`images` field mein files bhejo.

**Success Response `200`:**
```json
{
  "success": true,
  "data": { /* updated tour object */ }
}
```

---

### 11. Delete Tour Image

**Method:** `DELETE`

**Endpoint:** `/tour/delete-tour-image/:id`

**Request Body:**
```json
{ "index": 2 }
```

**Success Response `200`:**
```json
{
  "success": true,
  "removed": "https://cdn.example.com/image.jpg",
  "remaining": ["https://cdn.example.com/image2.jpg"]
}
```

---

## Booking APIs

---

### 12. Create Tour Booking

**Method:** `POST`

**Endpoint:** `/tour/tour-booking/create-tour-booking`

**Content-Type:** `application/json`

#### Online Payment — Seat Select ke saath

```json
{
  "userId": "67abc1234567890def123456",
  "tourId": "664f1a2b3c4d5e6f7a8b9c0d",
  "vehicleId": "vehicle_objectid",
  "seats": ["1A", "1B"],
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "passengers": [
    {
      "type": "adult",
      "fullName": "Rahul Sharma",
      "gender": "male",
      "dateOfBirth": "1995-06-15T00:00:00.000Z"
    },
    {
      "type": "adult",
      "fullName": "Priya Sharma",
      "gender": "female",
      "dateOfBirth": "1997-03-20T00:00:00.000Z"
    }
  ],
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-16T00:00:00.000Z",
  "tourStartDate": "2026-04-10T00:00:00.000Z",
  "bookingSource": "app",
  "tax": 450,
  "discount": 0,
  "payment": {
    "mode": "online",
    "isPaid": false
  }
}
```

#### Offline / Cash Payment (Panel se)

```json
{
  "userId": "67abc1234567890def123456",
  "tourId": "664f1a2b3c4d5e6f7a8b9c0d",
  "vehicleId": "vehicle_objectid",
  "seats": ["2A", "2B"],
  "numberOfAdults": 2,
  "numberOfChildren": 1,
  "passengers": [
    { "type": "adult", "fullName": "Amit Kumar", "gender": "male", "dateOfBirth": "1990-01-01T00:00:00.000Z" },
    { "type": "adult", "fullName": "Sunita Kumar", "gender": "female", "dateOfBirth": "1992-05-10T00:00:00.000Z" },
    { "type": "child", "fullName": "Rohan Kumar", "gender": "male", "dateOfBirth": "2016-08-20T00:00:00.000Z" }
  ],
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-16T00:00:00.000Z",
  "tourStartDate": "2026-04-10T00:00:00.000Z",
  "bookingSource": "panel",
  "tax": 500,
  "discount": 200,
  "payment": {
    "mode": "offline",
    "isPaid": true,
    "collectedBy": "Staff Name"
  }
}
```

#### Bina Seat Select ke (seats nahi chahiye)

```json
{
  "userId": "67abc1234567890def123456",
  "tourId": "664f1a2b3c4d5e6f7a8b9c0d",
  "vehicleId": "vehicle_objectid",
  "seats": [],
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "passengers": [],
  "bookingSource": "app",
  "tax": 400,
  "discount": 0,
  "payment": {
    "mode": "online",
    "isPaid": false
  }
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Tour booking created. Complete online payment to confirm.",
  "data": {
    "_id": "booking_objectid",
    "bookingCode": "AB12CD34EF",
    "userId": "67abc1234567890def123456",
    "tourId": "664f1a2b3c4d5e6f7a8b9c0d",
    "vehicleId": "vehicle_objectid",
    "seats": ["1A", "1B"],
    "status": "pending",
    "numberOfAdults": 2,
    "numberOfChildren": 0,
    "basePrice": 8000,
    "seatPrice": 1000,
    "tax": 450,
    "discount": 0,
    "totalAmount": 9450,
    "payment": {
      "mode": "online",
      "isPaid": false,
      "paidAt": null
    },
    "travelAgencyName": "Sai Tours",
    "city": "Varanasi",
    "from": "2026-04-10T00:00:00.000Z",
    "to": "2026-04-16T00:00:00.000Z",
    "createdAt": "2026-04-06T10:00:00.000Z"
  }
}
```

> `data._id` save karo — payment step mein lagega.

**Error Responses:**
```json
{ "success": false, "message": "userId, tourId and vehicleId are required" }
{ "success": false, "message": "Tour not found" }
{ "success": false, "message": "Vehicle not found" }
{ "success": false, "message": "Seats count must match total passengers" }
{ "success": false, "message": "Some seats already booked", "conflictSeats": ["1A"] }
```

---

### 13. Get All Bookings (Admin)

**Method:** `GET`

**Endpoint:** `/tour/tour-booking/get-bookings`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* booking objects */ ]
}
```

---

### 14. Get Bookings By User

**Method:** `GET`

**Endpoint:** `/tour/tour-booking/get-users-booking?userId=USR-1001`

**Query Param:** `userId` (required)

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* user ke saare bookings */ ]
}
```

---

### 15. Get Booking By Booking ID / Code

**Method:** `GET`

**Endpoint:** `/tour/tour-booking/get-users-booking/by/:bookingId`

`:bookingId` = MongoDB `_id` ya `bookingCode` (dono chalate hain)

**Success Response `200`:**
```json
{
  "success": true,
  "data": { /* single booking object */ }
}
```

**Error Responses:**
```json
{ "success": false, "message": "bookingId is required" }
{ "success": false, "message": "Booking not found" }
```

---

### 16. Get Bookings By Agency Email

**Method:** `GET`

**Endpoint:** `/tour/tour-booking/get-bookings/by-agency-email/:email`

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ /* agency ke saare bookings */ ]
}
```

---

### 17. Get Total Sell

**Method:** `GET`

**Endpoint:** `/tour/tour-booking/get-total-sell`

Cancelled bookings exclude hote hain.

**Success Response `200`:**
```json
{
  "success": true,
  "totalSell": 125000
}
```

---

### 18. Update Booking

**Method:** `PATCH`

**Endpoint:** `/tour/tour-booking/update-tour-booking/:bookingId`

Booking cancel karne par seats automatically release ho jaati hain.

**Confirm karne ke liye:**
```json
{ "status": "confirmed" }
```

**Cancel karne ke liye:**
```json
{
  "status": "cancelled"
}
```

**Payment update karne ke liye:**
```json
{
  "payment": {
    "isPaid": true,
    "paidAt": "2026-04-06T11:00:00.000Z",
    "paymentId": "phonepe_txn_id",
    "collectedBy": "Staff Name"
  }
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": { /* updated booking object */ }
}
```

**Error Responses:**
```json
{ "success": false, "message": "Booking not found" }
{ "success": false, "message": "Failed to update booking" }
```

---

### 19. Delete Booking

**Method:** `PATCH`

**Endpoint:** `/tour/tour-booking/delete-tour-booking/:bookingId`

`:bookingId` = MongoDB `_id` ya `bookingCode`

Seats bhi automatically release ho jaati hain.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Booking deleted successfully"
}
```

---

## Payment APIs (Tour)

Payment endpoints `/payment` route par hain:

### Create Payment Order (Online)
```
POST /payment/create-order/tour/:bookingId
```
Body: kuch nahi

### Verify Payment
```
POST /payment/verify/tour/:bookingId
```
Body: kuch nahi

---

## Mobile App — Complete Tour Booking Flow

### API Call Sequence

```
STEP 1 → GET  /tour/get-all-tours                                     (tour listing)
       → GET  /tour/filter-tour/by-query?...                          (filtered tours)
STEP 2 → GET  /tour/tours/visiting-places                             (autocomplete)
STEP 3 → GET  /tour/get-tour/:tourId                                  (tour detail)
STEP 4 → GET  /tour/tours/:tourId/vehicles/:vehicleId/seats           (seat picker)
STEP 5 → POST /tour/tour-booking/create-tour-booking                  (booking create)
STEP 6 → POST /payment/create-order/tour/:bookingId                   (payment — Online)
STEP 7 → POST /payment/verify/tour/:bookingId                         (payment verify)
STEP 8 → GET  /tour/tour-booking/get-users-booking?userId=...         (my bookings)
```

---

### STEP 1 — Tour Listing Screen

```
GET /tour/get-all-tours?page=1&limit=10&sortBy=price&sortOrder=asc
```

**Ya filter ke saath:**
```
GET /tour/filter-tour/by-query?fromWhere=Delhi&to=Goa&minPrice=5000&maxPrice=20000&minNights=3&runningStatus=upcoming
```

---

### STEP 2 — Search Autocomplete

```
GET /tour/tours/visiting-places
```

---

### STEP 3 — Tour Detail Screen

```
GET /tour/get-tour/:tourId
```

---

### STEP 4 — Seat Picker (Vehicle select karke)

```
GET /tour/tours/:tourId/vehicles/:vehicleId/seats
```

`seatMatrix` array se UI render karo:
- `status: "available"` → selectable (green)
- `status: "booked"` → disabled (grey/red)
- `type: "aisle"` → gap dikhao

---

### STEP 5 — Booking Create

**Online (2 adults, seats ke saath):**
```json
{
  "userId": "67abc1234567890def123456",
  "tourId": "664f1a2b3c4d5e6f7a8b9c0d",
  "vehicleId": "vehicle_objectid",
  "seats": ["2A", "2B"],
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "passengers": [
    { "type": "adult", "fullName": "Rahul Sharma", "gender": "male", "dateOfBirth": "1995-06-15T00:00:00.000Z" },
    { "type": "adult", "fullName": "Priya Sharma", "gender": "female", "dateOfBirth": "1997-03-20T00:00:00.000Z" }
  ],
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-16T00:00:00.000Z",
  "tourStartDate": "2026-04-10T00:00:00.000Z",
  "bookingSource": "app",
  "tax": 450,
  "discount": 0,
  "payment": {
    "mode": "online",
    "isPaid": false
  }
}
```

---

### STEP 6 — Payment Initiate (Online only)

```
POST /payment/create-order/tour/:bookingId
```

`:bookingId` = STEP 5 response ka `data._id`

---

### STEP 7 — Payment Verify

```
POST /payment/verify/tour/:bookingId
```

---

### STEP 8 — My Bookings Screen

```
GET /tour/tour-booking/get-users-booking?userId=67abc1234567890def123456
```

---

### Booking Status → App Screen Mapping

| `status` | App mein kya dikhao |
|---|---|
| `pending` | "Payment pending — Complete karo" |
| `confirmed` | "Booking confirmed ✓" |
| `cancelled` | "Booking cancelled" |
| `failed` | "Booking failed — Try again" |

---

## Important Notes

1. `seats` array aur `numberOfAdults + numberOfChildren` ka count match karna chahiye — warna 400 error aayega
2. `seats: []` bhejo agar seat selection nahi chahiye
3. Booking create hote hi selected seats lock ho jaate hain
4. Cancel karne par seats automatically release ho jaate hain
5. `payment.mode: "offline"` aur `payment.isPaid: true` bhejne par booking seedha `confirmed` banti hai
6. Online booking `pending` status mein banti hai — payment verify ke baad `confirmed` hoti hai
7. Tour sirf `isAccepted: true` hone ke baad public listing mein aata hai
