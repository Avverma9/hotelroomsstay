# Tour Admin Panel Build Guide

Yeh document frontend team ke liye hai. Iska purpose hai:

- admin panel me kaun kaun se screens banenge
- har screen me kaunsi API use hogi
- request payload aur response payload ka expected shape kya hoga
- kaunse flows `JSON` se chalenge aur kaunse `FormData` se

Is guide ka scope current backend code ke tour module par based hai.

## 1) Recommended Admin Panel Modules

### A. Tour Dashboard

Use cases:

- total tour bookings dekhna
- total sell dekhna
- pending tour requests dekhna
- accepted tours dekhna

Suggested widgets:

- Total accepted tours
- Total pending tours
- Total bookings
- Total sell

### B. Tour List Page

Use cases:

- accepted tours list
- single tour open karna
- search/filter karna
- edit screen open karna

### C. Pending Tour Requests Page

Use cases:

- jo tours abhi `isAccepted: false` me hain unhe dekhna
- admin approval/rejection flow chalana

Note:

- Separate approve API nahi hai
- Approval current code me `PATCH /update-tour/data/:id` se hota hai by sending `isAccepted: true`

### D. Add Tour Page

Use cases:

- new package create karna
- images upload karna
- itinerary, terms, vehicles add karna

### E. Edit Tour Page

Use cases:

- basic info update
- itinerary update
- pricing update
- vehicles update

### F. Tour Image Management

Use cases:

- extra images append karna
- specific image delete karna

### G. Tour Bookings Page

Use cases:

- all tour bookings list
- booking detail open karna
- confirm/cancel booking
- agency-wise bookings dekhna

### H. Tour Theme Management

Use cases:

- theme dropdown ke liye theme list maintain karna

## 2) Core Tour Data Shape

Admin panel form fields ko backend ke is shape ke hisaab se map karo:

```json
{
  "travelAgencyName": "string",
  "agencyId": "string",
  "agencyPhone": "string",
  "agencyEmail": "string",
  "isAccepted": false,
  "country": "string",
  "state": "string",
  "city": "string",
  "visitngPlaces": "string",
  "themes": "string",
  "price": 0,
  "nights": 0,
  "days": 0,
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-13T00:00:00.000Z",
  "isCustomizable": false,
  "amenities": ["string"],
  "inclusion": ["string"],
  "exclusion": ["string"],
  "termsAndConditions": {
    "cancellation": "string"
  },
  "dayWise": [
    {
      "day": 1,
      "description": "string"
    }
  ],
  "starRating": 4,
  "images": ["uploaded image url"],
  "vehicles": [
    {
      "name": "Tempo Traveller",
      "vehicleNumber": "HP01AB1234",
      "totalSeats": 12,
      "seaterType": "2x2",
      "seatConfig": {
        "rows": 6,
        "left": 2,
        "right": 2,
        "aisle": true
      },
      "seatLayout": ["1A", "1B", "1C", "1D"],
      "bookedSeats": [],
      "pricePerSeat": 1500,
      "isActive": true
    }
  ]
}
```

Important:

- Backend field ka name `visitngPlaces` hai, `visitingPlaces` nahi
- `starRating` valid range `1` se `5` tak hai
- `vehicles.totalSeats`, `price`, `nights`, `days`, `pricePerSeat` numeric values hone chahiye
- `termsAndConditions` object hota hai
- `dayWise`, `amenities`, `inclusion`, `exclusion`, `vehicles` arrays hain

## 3) Screen to API Mapping

| Screen | API |
| --- | --- |
| Dashboard | `GET /tour-booking/get-total-sell`, `GET /tour-booking/get-bookings`, `GET /get-tour-list`, `GET /get-requests` |
| Tour List | `GET /get-tour-list`, `GET /get-tour/:id`, `GET /filter-tour/by-query` |
| Pending Requests | `GET /get-requests`, `PATCH /update-tour/data/:id` |
| Add Tour | `POST /create-tour`, `GET /additional/get-tour-themes` |
| Edit Tour | `GET /get-tour/:id`, `PATCH /update-tour/data/:id` |
| Images | `PATCH /update-tour-image/:id`, `DELETE /delete-tour-image/:id` |
| Agency Tours | `GET /get-tour/by-owner/query?email=` |
| Vehicle Seats | `GET /tours/:tourId/vehicles/:vehicleId/seats` |
| Bookings | `GET /tour-booking/get-bookings`, `GET /tour-booking/get-users-booking/by/:bookingId`, `PATCH /tour-booking/update-tour-booking/:bookingId`, `PATCH /tour-booking/delete-tour-booking/:bookingId` |
| Theme Master | `GET /additional/get-tour-themes`, `POST /additional/add-tour-theme`, `DELETE /additional/delete-tour-theme/:id` |

## 4) API Details

## 4.1 Get Tour Themes

- Method: `GET`
- URL: `/additional/get-tour-themes`
- Use: add/edit form me theme dropdown fill karna

### Response

```json
[
  {
    "_id": "67f1d111a12b34567890a001",
    "name": "Adventure",
    "__v": 0
  },
  {
    "_id": "67f1d111a12b34567890a002",
    "name": "Family",
    "__v": 0
  }
]
```

## 4.2 Add Tour Theme

- Method: `POST`
- URL: `/additional/add-tour-theme`
- Content-Type: `application/json`

### Request Payload

```json
{
  "name": "Adventure"
}
```

### Success Response

Status: `201`

```json
{
  "_id": "67f1d111a12b34567890a001",
  "name": "Adventure",
  "__v": 0
}
```

## 4.3 Get Accepted Tours List

- Method: `GET`
- URL: `/get-tour-list`
- Use: live/approved tour list page

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "67f1c9d2a12b34567890abcd",
      "travelAgencyName": "Himalayan Escape",
      "agencyEmail": "ops@himalayanescape.com",
      "city": "Manali",
      "themes": "Adventure",
      "price": 8999,
      "nights": 3,
      "days": 4,
      "isAccepted": true,
      "images": [
        "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg"
      ],
      "createdAt": "2026-03-11T10:30:00.000Z",
      "updatedAt": "2026-03-11T10:30:00.000Z"
    }
  ]
}
```

## 4.4 Get Pending Tour Requests

- Method: `GET`
- URL: `/get-requests`
- Use: pending approval page

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "67f1c9d2a12b34567890abff",
      "travelAgencyName": "Himalayan Escape",
      "agencyEmail": "ops@himalayanescape.com",
      "city": "Manali",
      "themes": "Adventure",
      "price": 8999,
      "isAccepted": false
    }
  ]
}
```

## 4.5 Get Single Tour

- Method: `GET`
- URL: `/get-tour/:id`
- Use: edit page load karna

Example:

- `/get-tour/67f1c9d2a12b34567890abcd`

### Success Response

```json
{
  "success": true,
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "travelAgencyName": "Himalayan Escape",
    "agencyId": "AGENCY-1001",
    "agencyPhone": "9876543210",
    "agencyEmail": "ops@himalayanescape.com",
    "isAccepted": false,
    "country": "India",
    "state": "Himachal Pradesh",
    "city": "Manali",
    "visitngPlaces": "Manali, Solang Valley, Atal Tunnel",
    "themes": "Adventure",
    "price": 8999,
    "nights": 3,
    "days": 4,
    "from": "2026-04-10T00:00:00.000Z",
    "to": "2026-04-13T00:00:00.000Z",
    "isCustomizable": true,
    "amenities": ["Hotel Stay", "Breakfast", "Transport"],
    "inclusion": ["Sightseeing", "Pickup", "Dinner"],
    "exclusion": ["Flight", "Personal Expense"],
    "termsAndConditions": {
      "cancellation": "Non-refundable within 48 hours"
    },
    "dayWise": [
      {
        "day": 1,
        "description": "Arrival and local check-in"
      }
    ],
    "starRating": 4,
    "images": [
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg"
    ],
    "vehicles": [
      {
        "_id": "67f1c9d2a12b34567890abce",
        "name": "Tempo Traveller",
        "vehicleNumber": "HP01AB1234",
        "totalSeats": 12,
        "seaterType": "2x2",
        "seatConfig": {
          "rows": 6,
          "left": 2,
          "right": 2,
          "aisle": true
        },
        "seatLayout": ["1A", "1B", "1C", "1D"],
        "bookedSeats": [],
        "pricePerSeat": 1500,
        "isActive": true
      }
    ]
  }
}
```

### Not Found Response

```json
{
  "success": false,
  "message": "Tour not found"
}
```

## 4.6 Add Tour

- Method: `POST`
- URL: `/create-tour`
- Content-Type: `multipart/form-data`
- Use: add tour page

### Frontend Rule

- `FormData` use karo
- arrays/object fields ko `JSON.stringify(...)` karke bhejo
- images ke liye standard field name `images` use karo

### Request Payload

```json
{
  "travelAgencyName": "Himalayan Escape",
  "agencyId": "AGENCY-1001",
  "agencyPhone": "9876543210",
  "agencyEmail": "ops@himalayanescape.com",
  "country": "India",
  "state": "Himachal Pradesh",
  "city": "Manali",
  "visitngPlaces": "Manali, Solang Valley, Atal Tunnel",
  "themes": "Adventure",
  "price": 8999,
  "nights": 3,
  "days": 4,
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-13T00:00:00.000Z",
  "isCustomizable": true,
  "amenities": "[\"Hotel Stay\",\"Breakfast\",\"Transport\"]",
  "inclusion": "[\"Sightseeing\",\"Pickup\",\"Dinner\"]",
  "exclusion": "[\"Flight\",\"Personal Expense\"]",
  "termsAndConditions": "{\"cancellation\":\"Non-refundable within 48 hours\",\"childPolicy\":\"Above 5 years chargeable\"}",
  "dayWise": "[{\"day\":1,\"description\":\"Arrival and local check-in\"}]",
  "starRating": 4,
  "vehicles": "[{\"name\":\"Tempo Traveller\",\"vehicleNumber\":\"HP01AB1234\",\"totalSeats\":12,\"seaterType\":\"2x2\",\"seatConfig\":{\"rows\":6,\"left\":2,\"right\":2,\"aisle\":true},\"seatLayout\":[\"1A\",\"1B\",\"1C\",\"1D\"],\"bookedSeats\":[],\"pricePerSeat\":1500,\"isActive\":true}]"
}
```

Files:

- `images`: one or multiple files

### Success Response

Status: `201`

```json
{
  "success": true,
  "message": "Tour created successfully",
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "travelAgencyName": "Himalayan Escape",
    "agencyId": "AGENCY-1001",
    "isAccepted": false,
    "images": [
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg"
    ],
    "vehicles": [
      {
        "_id": "67f1c9d2a12b34567890abce",
        "name": "Tempo Traveller",
        "totalSeats": 12,
        "pricePerSeat": 1500
      }
    ],
    "createdAt": "2026-03-11T10:30:00.000Z",
    "updatedAt": "2026-03-11T10:30:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Failed to create tour",
  "error": "Validation or upload error message"
}
```

## 4.7 Update Tour

- Method: `PATCH`
- URL: `/update-tour/data/:id`
- Content-Type: `application/json`
- Use: edit page, approval, rejection notes, status changes

### Common Use Cases

#### A. Normal update

```json
{
  "travelAgencyName": "Himalayan Escape Premium",
  "price": 9999,
  "nights": 4,
  "days": 5,
  "themes": "Adventure Premium",
  "amenities": ["Hotel Stay", "Breakfast", "Dinner", "Transport"],
  "inclusion": ["Sightseeing", "Pickup", "Dinner", "Camp Fire"],
  "exclusion": ["Flight", "Personal Expense", "Entry Tickets"],
  "termsAndConditions": {
    "cancellation": "50% refund before 5 days"
  },
  "dayWise": [
    {
      "day": 1,
      "description": "Arrival and hotel check-in"
    }
  ]
}
```

#### B. Approve pending request

```json
{
  "isAccepted": true
}
```

#### C. Deactivate vehicle

```json
{
  "vehicles": [
    {
      "name": "Tempo Traveller",
      "vehicleNumber": "HP01AB1234",
      "totalSeats": 12,
      "seaterType": "2x2",
      "seatConfig": {
        "rows": 6,
        "left": 2,
        "right": 2,
        "aisle": true
      },
      "seatLayout": ["1A", "1B", "1C", "1D"],
      "bookedSeats": [],
      "pricePerSeat": 1500,
      "isActive": false
    }
  ]
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "travelAgencyName": "Himalayan Escape Premium",
    "price": 9999,
    "nights": 4,
    "days": 5,
    "isAccepted": true,
    "updatedAt": "2026-03-11T11:00:00.000Z"
  }
}
```

### Not Found Response

```json
{
  "success": false,
  "message": "Tour not found"
}
```

## 4.8 Append Tour Images

- Method: `PATCH`
- URL: `/update-tour-image/:id`
- Content-Type: `multipart/form-data`
- Use: edit page me additional images upload

### Request

Files:

- `images`: one or multiple files

### Success Response

```json
{
  "success": true,
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "images": [
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg",
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000500-tour-3.jpg"
    ]
  }
}
```

## 4.9 Delete Tour Image

- Method: `DELETE`
- URL: `/delete-tour-image/:id`
- Content-Type: `application/json`

### Request Payload

```json
{
  "index": 1
}
```

### Success Response

```json
{
  "success": true,
  "removed": "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000500-tour-3.jpg",
  "remaining": [
    "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg"
  ]
}
```

### Invalid Index Response

```json
{
  "success": false,
  "message": "Invalid index"
}
```

## 4.10 Filter Tours

- Method: `GET`
- URL: `/filter-tour/by-query`
- Use: advanced filter/search page

### Common Query Params

- `q`
- `country`
- `state`
- `city`
- `themes`
- `amenities`
- `minPrice`
- `maxPrice`
- `minNights`
- `maxNights`
- `minRating`
- `fromDate`
- `toDate`
- `isCustomizable`
- `hasImages`
- `hasVehicles`
- `page`
- `limit`
- `sortBy`
- `sortOrder`

Example:

- `/filter-tour/by-query?city=Manali&themes=Adventure&minPrice=5000&maxPrice=15000&page=1&limit=10`

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "67f1c9d2a12b34567890abcd",
      "city": "Manali",
      "themes": "Adventure",
      "price": 8999
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "applied": {
    "city": "Manali",
    "themes": "Adventure",
    "minPrice": 5000,
    "maxPrice": 15000,
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "usedCityFallback": false,
    "usedRouteLooseFallback": false
  }
}
```

## 4.11 Get Tours By Agency Email

- Method: `GET`
- URL: `/get-tour/by-owner/query?email=ops@himalayanescape.com`
- Use: agency specific listing

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "67f1c9d2a12b34567890abcd",
      "agencyEmail": "ops@himalayanescape.com",
      "travelAgencyName": "Himalayan Escape",
      "isAccepted": true
    }
  ]
}
```

## 4.12 Get Vehicle Seat Layout

- Method: `GET`
- URL: `/tours/:tourId/vehicles/:vehicleId/seats`
- Use: seat preview in admin panel or booking investigation

### Response

```json
{
  "success": true,
  "vehicle": {
    "_id": "67f1c9d2a12b34567890abce",
    "name": "Tempo Traveller",
    "vehicleNumber": "HP01AB1234",
    "totalSeats": 12,
    "seaterType": "2x2",
    "seatConfig": {
      "rows": 6,
      "left": 2,
      "right": 2,
      "aisle": true
    },
    "seatLayout": ["1A", "1B", "1C", "1D"],
    "seatMatrix": [
      [
        { "code": "1A", "side": "left", "status": "booked" },
        { "code": "1B", "side": "left", "status": "available" },
        { "type": "aisle" },
        { "code": "1C", "side": "right", "status": "available" },
        { "code": "1D", "side": "right", "status": "booked" }
      ]
    ],
    "bookedSeats": ["1A", "1D"]
  }
}
```

## 4.13 Get All Tour Bookings

- Method: `GET`
- URL: `/tour-booking/get-bookings`
- Use: booking list page

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "67f1f001a12b34567890c001",
      "bookingCode": "AB12CD34EF",
      "userId": "USER-101",
      "tourId": "67f1c9d2a12b34567890abcd",
      "vehicleId": "67f1c9d2a12b34567890abce",
      "status": "pending",
      "numberOfAdults": 2,
      "numberOfChildren": 0,
      "seats": ["1A", "1B"],
      "basePrice": 8999,
      "seatPrice": 3000,
      "tax": 100,
      "discount": 50,
      "totalAmount": 12049,
      "createdAt": "2026-03-11T12:00:00.000Z"
    }
  ]
}
```

## 4.14 Get Booking By Booking Id Or Booking Code

- Method: `GET`
- URL: `/tour-booking/get-users-booking/by/:bookingId`
- Use: booking detail drawer/page

Example:

- `/tour-booking/get-users-booking/by/67f1f001a12b34567890c001`
- `/tour-booking/get-users-booking/by/AB12CD34EF`

### Response

```json
{
  "success": true,
  "data": {
    "_id": "67f1f001a12b34567890c001",
    "bookingCode": "AB12CD34EF",
    "userId": "USER-101",
    "tourId": "67f1c9d2a12b34567890abcd",
    "vehicleId": "67f1c9d2a12b34567890abce",
    "status": "pending",
    "travelAgencyName": "Himalayan Escape",
    "agencyEmail": "ops@himalayanescape.com",
    "visitngPlaces": "Manali, Solang Valley, Atal Tunnel",
    "seats": ["1A", "1B"],
    "numberOfAdults": 2,
    "numberOfChildren": 0,
    "basePrice": 8999,
    "seatPrice": 3000,
    "tax": 100,
    "discount": 50,
    "totalAmount": 12049
  }
}
```

## 4.15 Update Booking Status

- Method: `PATCH`
- URL: `/tour-booking/update-tour-booking/:bookingId`
- Content-Type: `application/json`
- Use: admin booking confirm/cancel

### Confirm Booking Request

```json
{
  "status": "confirmed"
}
```

### Cancel Booking Request

```json
{
  "status": "cancelled"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "_id": "67f1f001a12b34567890c001",
    "bookingCode": "AB12CD34EF",
    "status": "confirmed"
  }
}
```

## 4.16 Delete Booking

- Method: `PATCH`
- URL: `/tour-booking/delete-tour-booking/:bookingId`
- Use: booking remove karna

Example:

- `/tour-booking/delete-tour-booking/67f1f001a12b34567890c001`
- `/tour-booking/delete-tour-booking/AB12CD34EF`

### Success Response

```json
{
  "success": true,
  "message": "Booking deleted successfully"
}
```

## 4.17 Get Total Sell

- Method: `GET`
- URL: `/tour-booking/get-total-sell`
- Use: dashboard revenue card

### Response

```json
{
  "success": true,
  "totalSell": 245000
}
```

## 5) Recommended Frontend Screen Flow

## 5.1 Add Tour Form

Fields:

- Agency info
- Location info
- Tour info
- Amenities
- Inclusion
- Exclusion
- Terms and conditions
- Day wise itinerary
- Vehicle setup
- Image upload

Submission rule:

- `FormData` use karo
- arrays/object ko stringify karo

## 5.2 Edit Tour Form

Load flow:

1. `GET /get-tour/:id`
2. response ko form me prefill karo
3. save par `PATCH /update-tour/data/:id`
4. new images add karne ke liye `PATCH /update-tour-image/:id`
5. image remove karne ke liye `DELETE /delete-tour-image/:id`

## 5.3 Approval Flow

1. `GET /get-requests`
2. list me pending tours show karo
3. approve button par:

```json
{
  "isAccepted": true
}
```

4. call `PATCH /update-tour/data/:id`

## 5.4 Booking Management Flow

1. `GET /tour-booking/get-bookings`
2. booking detail ke liye `GET /tour-booking/get-users-booking/by/:bookingId`
3. confirm ke liye `PATCH /tour-booking/update-tour-booking/:bookingId`
4. cancel ke liye same update API with `status: "cancelled"`
5. hard delete ke liye `PATCH /tour-booking/delete-tour-booking/:bookingId`

## 6) Frontend Implementation Notes

- Create tour me always `multipart/form-data` use karo
- Update tour me `application/json` use karo
- Images same update API me mat bhejo
- `visitngPlaces` backend typo ko frontend me same key ke saath map karo
- Pending/approved list separate APIs se aayegi
- Admin approval ke liye dedicated endpoint nahi hai; `isAccepted` ko update karna hai
- Filters ke liye query string builder reusable banao
- Vehicle editor me `seatConfig` aur `seatLayout` dono support rakhna useful rahega
- Bookings page me `bookingCode`, `status`, `totalAmount`, `agencyEmail`, `travelAgencyName`, `seats` prominently show karo

## 7) Backend Reference Files

- `routes/tour/tour.js`
- `controllers/tour/tour.js`
- `controllers/tour/booking.js`
- `models/tour/tour.js`
- `models/tour/booking.js`
- `routes/additional/additional.js`
- `controllers/addtionalSettings/tourTheme.js`
