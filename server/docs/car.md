# Travel Car & Booking API Docs

Base URL: `hotelroomsstay.com/api`

All endpoints in this document are mounted under `/travel`.

Full base path for these APIs:

```text
hotelroomsstay.com/api/travel
```

## Rider Panel Scope

Rider panel banane ke liye sabse important endpoints ye hain:

1. `GET /travel/filter-car/by-query`
2. `GET /travel/get-a-car/:id`
3. `GET /travel/get-seat-data/by-id/:id`
4. `POST /travel/create-travel/booking`
5. `GET /travel/get-bookings-by/user/:userId`
6. `POST /travel/get-bookings-by/bookedBy`

Baaki endpoints owner/admin side ke liye useful hain, lekin yahan sabhi APIs documented hain.

## General Notes

- `:id`, `:ownerId`, `carId` MongoDB ObjectId hote hain.
- Date fields `pickupD` aur `dropD` ISO date format me bhejna best rahega, example: `2026-04-01T10:00:00.000Z`
- Car image upload endpoints `multipart/form-data` use karte hain.
- Upload middleware `.any()` use karta hai, isliye image file kisi bhi field name se bheji ja sakti hai. Recommended field name: `images`.
- Booking status allowed values: `Pending`, `Confirmed`, `Cancelled`, `Failed`
- Car `sharingType` allowed values: `Private`, `Shared`
- Car `vehicleType` allowed values: `Bike`, `Car`, `Bus`

## Common Response Shapes

### Seat Object

```json
{
  "_id": "67e3c1ef2b1a7d8e9f100001",
  "seatType": "Window",
  "seatNumber": 1,
  "seatPrice": 450,
  "isBooked": false,
  "bookedBy": ""
}
```

### Car Object

```json
{
  "_id": "67e3c1ef2b1a7d8e9f100010",
  "make": "Toyota",
  "model": "Innova",
  "vehicleNumber": "DL01AB1234",
  "vehicleType": "Car",
  "sharingType": "Shared",
  "images": [
    "https://cdn.example.com/cars/innova-front.jpg"
  ],
  "year": 2024,
  "pickupP": "Delhi",
  "dropP": "Jaipur",
  "seater": 6,
  "runningStatus": "Available",
  "seatConfig": [
    {
      "_id": "67e3c1ef2b1a7d8e9f100001",
      "seatType": "Window",
      "seatNumber": 1,
      "isBooked": false,
      "seatPrice": 450,
      "bookedBy": ""
    }
  ],
  "extraKm": 12,
  "perPersonCost": 450,
  "pickupD": "2026-04-01T10:00:00.000Z",
  "dropD": "2026-04-01T16:00:00.000Z",
  "price": 2500,
  "color": "White",
  "mileage": 16,
  "fuelType": "Diesel",
  "transmission": "Manual",
  "ownerId": "67e3c1ef2b1a7d8e9f100099",
  "dateAdded": "2026-03-25T10:00:00.000Z",
  "isAvailable": true
}
```

### Booking Object

```json
{
  "_id": "67e3c5f42b1a7d8e9f100555",
  "bookingId": "AB12CD34",
  "carId": "67e3c1ef2b1a7d8e9f100010",
  "userId": "USR-1001",
  "passengerName": "Aman Sharma",
  "customerMobile": "9876543210",
  "customerEmail": "aman@example.com",
  "bookedBy": "9876543210",
  "vehicleType": "Car",
  "sharingType": "Shared",
  "vehicleNumber": "DL01AB1234",
  "make": "Toyota",
  "model": "Innova",
  "color": "White",
  "pickupP": "Delhi",
  "dropP": "Jaipur",
  "pickupD": "2026-04-01T10:00:00.000Z",
  "dropD": "2026-04-01T16:00:00.000Z",
  "seats": [
    "67e3c1ef2b1a7d8e9f100001"
  ],
  "totalSeatsBooked": 1,
  "basePrice": 450,
  "gstRate": 5,
  "gstPrice": 5,
  "gstAmount": 22.5,
  "price": 472.5,
  "paymentMethod": "Online",
  "paymentId": "pay_QWERTY123",
  "isPaid": false,
  "bookingStatus": "Pending",
  "cancellationReason": "",
  "bookingDate": "2026-03-26T09:30:00.000Z",
  "createdAt": "2026-03-26T09:30:00.000Z",
  "updatedAt": "2026-03-26T09:30:00.000Z"
}
```

## Car APIs

## 1. Add Car

**Method:** `POST`

**Endpoint:** `/travel/add-a-car`

**Content-Type:** `multipart/form-data`

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `make` | String | Yes | Example: `Toyota` |
| `model` | String | Yes | Example: `Innova` |
| `vehicleNumber` | String | No | |
| `vehicleType` | String | Yes | `Bike` or `Car` or `Bus` |
| `sharingType` | String | Yes | `Private` or `Shared` |
| `year` | Number | Yes | Current year se bada nahi hona chahiye |
| `pickupP` | String | No | Pickup place |
| `dropP` | String | No | Drop place |
| `pickupD` | Date String | No | ISO date |
| `dropD` | Date String | No | Must be greater than `pickupD` |
| `price` | Number | Yes | Private trip base price |
| `perPersonCost` | Number | No | Shared trip cost per seat |
| `extraKm` | Number | No | |
| `color` | String | Yes | |
| `mileage` | Number | No | Default `0` |
| `fuelType` | String | Yes | `Petrol`, `Diesel`, `Electric`, `Hybrid` |
| `transmission` | String | Yes | `Automatic` or `Manual` |
| `seater` | Number | Conditionally | If `seatConfig` not provided |
| `seatConfig` | JSON String or Array | No | Shared/private seats config |
| `ownerId` | ObjectId | No | Existing owner id |
| `ownerName` | String | Conditionally | Required when creating owner on the fly |
| `ownerEmail` | String | Conditionally | Owner email or mobile required |
| `ownerMobile` | String | Conditionally | Owner email or mobile required |
| `ownerDrivingLicence` | String | No | |
| `ownerAddress` | String | No | |
| `ownerCity` | String | No | |
| `ownerState` | String | No | |
| `ownerPinCode` | Number/String | No | |
| `images` | File[] | No | Any image field name accepted |

### Example Request

```http
POST hotelroomsstay.com/api/travel/add-a-car
Content-Type: multipart/form-data
```

```json
{
  "make": "Toyota",
  "model": "Innova",
  "vehicleType": "Car",
  "sharingType": "Shared",
  "year": 2024,
  "pickupP": "Delhi",
  "dropP": "Jaipur",
  "pickupD": "2026-04-01T10:00:00.000Z",
  "dropD": "2026-04-01T16:00:00.000Z",
  "price": 2500,
  "perPersonCost": 450,
  "color": "White",
  "fuelType": "Diesel",
  "transmission": "Manual",
  "ownerName": "Ravi Yadav",
  "ownerEmail": "ravi@example.com",
  "ownerMobile": "9876543210",
  "seatConfig": "[{\"seatType\":\"Window\",\"seatNumber\":1,\"seatPrice\":450},{\"seatType\":\"Middle\",\"seatNumber\":2,\"seatPrice\":450}]"
}
```

### Success Response `201`

```json
{
  "message": "Successfully Created",
  "car": {
    "_id": "67e3c1ef2b1a7d8e9f100010",
    "make": "Toyota",
    "model": "Innova",
    "vehicleType": "Car",
    "sharingType": "Shared",
    "ownerId": "67e3c1ef2b1a7d8e9f100099",
    "seatConfig": [
      {
        "seatType": "Window",
        "seatNumber": 1,
        "seatPrice": 450,
        "isBooked": false,
        "bookedBy": ""
      }
    ]
  },
  "owner": {
    "_id": "67e3c1ef2b1a7d8e9f100099",
    "name": "Ravi Yadav",
    "email": "ravi@example.com",
    "mobile": 9876543210
  }
}
```

### Error Responses

```json
{ "message": "Invalid seatConfig format" }
```

```json
{ "message": "Invalid ownerId" }
```

```json
{ "message": "Owner email or mobile is required" }
```

```json
{ "message": "Invalid pickupD or dropD date format" }
```

```json
{ "message": "dropD must be greater than pickupD" }
```

## 2. Get Car By Id

**Method:** `GET`

**Endpoint:** `/travel/get-a-car/:id`

### Success Response `200`

Returns full car object.

```json
{
  "_id": "67e3c1ef2b1a7d8e9f100010",
  "make": "Toyota",
  "model": "Innova",
  "vehicleNumber": "DL01AB1234",
  "vehicleType": "Car",
  "sharingType": "Shared",
  "seatConfig": []
}
```

### Error Responses

```json
{ "message": "Invalid car id" }
```

```json
{ "message": "Car not found" }
```

## 3. Get My Cars

**Method:** `GET`

**Endpoint:** `/travel/get-my-cars`

### Header

```http
Authorization: <jwt-token>
```

### Success Response `200`

```json
[
  {
    "_id": "67e3c1ef2b1a7d8e9f100010",
    "make": "Toyota",
    "model": "Innova"
  }
]
```

If user car owner nahi hai to empty array milta hai:

```json
[]
```

### Error Response

```json
{ "message": "Access denied: User not found or email is missing." }
```

## 4. Get Cars By Owner Id

**Method:** `GET`

**Endpoint:** `/travel/get-a-car/by-owner/:ownerId`

### Success Response `200`

```json
[
  {
    "_id": "67e3c1ef2b1a7d8e9f100010",
    "ownerId": "67e3c1ef2b1a7d8e9f100099",
    "make": "Toyota"
  }
]
```

### Error Responses

```json
{ "message": "Invalid ownerId" }
```

```json
{ "message": "Car not found" }
```

## 5. Get All Cars

**Method:** `GET`

**Endpoint:** `/travel/get-all-car`

### Success Response `200`

```json
[
  {
    "_id": "67e3c1ef2b1a7d8e9f100010",
    "make": "Toyota",
    "model": "Innova"
  }
]
```

## 6. Update Car

**Method:** `PATCH`

**Endpoint:** `/travel/update-a-car/:id`

**Content-Type:** `multipart/form-data`

### Header

```http
Authorization: <jwt-token>
```

### Request Body

Partial update supported hai. Same fields use ho sakte hain jo add car me hain.

```json
{
  "price": 2800,
  "color": "Silver",
  "pickupD": "2026-04-01T11:00:00.000Z",
  "dropD": "2026-04-01T17:00:00.000Z",
  "seatConfig": "[{\"seatType\":\"Window\",\"seatNumber\":1,\"seatPrice\":500}]",
  "ownerName": "Ravi Kumar"
}
```

### Success Response `200`

```json
{
  "message": "Successfully Updated",
  "car": {
    "_id": "67e3c1ef2b1a7d8e9f100010",
    "price": 2800,
    "color": "Silver"
  }
}
```

### Error Responses

```json
{ "message": "Invalid car id" }
```

```json
{ "message": "Access denied: You are not registered as a car owner." }
```

```json
{ "message": "Access denied: You do not own this car." }
```

```json
{ "message": "Invalid seatConfig format" }
```

## 7. Delete Car

**Method:** `DELETE`

**Endpoint:** `/travel/delete-a-car/:id`

### Header

```http
Authorization: <jwt-token>
```

### Success Response `200`

```json
{ "message": "Successfully deleted" }
```

### Error Responses

```json
{ "message": "Invalid car id" }
```

```json
{ "message": "Access denied: No token provided" }
```

```json
{ "message": "Access denied: Invalid token" }
```

```json
{ "message": "Access denied: You do not own this car." }
```

## 8. Filter Cars

**Method:** `GET`

**Endpoint:** `/travel/filter-car/by-query`

### Query Params

| Param | Type | Required | Notes |
|---|---|---|---|
| `make` | String | No | Exact match |
| `model` | String | No | Exact match |
| `vehicleNumber` | String | No | Exact match |
| `fuelType` | String | No | Exact match |
| `seater` | Number | No | Must be numeric |
| `pickupP` | String | No | Case-insensitive partial match |
| `dropP` | String | No | Case-insensitive partial match |
| `pickupD` | Date String | No | Used with `dropD` |
| `dropD` | Date String | No | Used with `pickupD` |

### Example Request

```http
GET hotelroomsstay.com/api/travel/filter-car/by-query?pickupP=delhi&dropP=jaipur&seater=6&pickupD=2026-04-01T00:00:00.000Z&dropD=2026-04-02T00:00:00.000Z
```

### Success Response `200`

```json
[
  {
    "_id": "67e3c1ef2b1a7d8e9f100010",
    "pickupP": "Delhi",
    "dropP": "Jaipur",
    "isAvailable": true,
    "sharingType": "Shared"
  }
]
```

### Error Responses

```json
{ "message": "No filter parameters provided" }
```

```json
{ "message": "seater must be a number" }
```

```json
{ "message": "Invalid pickupD or dropD date format" }
```

```json
{ "message": "pickupD must be less than or equal to dropD" }
```

```json
{ "message": "No cars found matching the filters" }
```

## 9. Get Seat Data By Car Id

**Method:** `GET`

**Endpoint:** `/travel/get-seat-data/by-id/:id`

### Success Response `200`

```json
{
  "carId": "67e3c1ef2b1a7d8e9f100010",
  "seats": [
    {
      "_id": "67e3c1ef2b1a7d8e9f100001",
      "seatType": "Window",
      "seatNumber": 1,
      "seatPrice": 450,
      "isBooked": false,
      "bookedBy": ""
    }
  ]
}
```

### Error Responses

```json
{ "message": "Invalid car id" }
```

```json
{ "message": "Car not found" }
```

## Booking APIs

## 10. Create Travel Booking

**Method:** `POST`

**Endpoint:** `/travel/create-travel/booking`

### Request Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | String | Yes | System user id string |
| `carId` | ObjectId | Yes | Selected car id |
| `seats` | String[] | Conditionally | Shared booking me required |
| `sharingType` | String | No | Agar bhejo to selected car se match hona chahiye |
| `vehicleType` | String | No | Agar bhejo to selected car se match hona chahiye |
| `bookedBy` | String | No | Default mobile/email se fill ho jata hai |
| `customerMobile` | String | Yes | |
| `customerEmail` | String | Yes | |
| `passengerName` | String | No | |
| `paymentMethod` | String | No | `Online`, `Offline`, `Cash`, `UPI`, `Card` |
| `paymentId` | String | No | |
| `isPaid` | Boolean | No | Payment already captured hai to `true` bhejo |
| `confirmOnCreate` | Boolean | No | `true` bhejne par booking direct confirm ho sakti hai |
| `assignedDriverId` | String | No | Driver assignment snapshot |
| `assignedDriverName` | String | No | Driver name snapshot |

### Shared Booking Example

```json
{
  "userId": "USR-1001",
  "carId": "67e3c1ef2b1a7d8e9f100010",
  "sharingType": "Shared",
  "vehicleType": "Car",
  "seats": [
    "67e3c1ef2b1a7d8e9f100001",
    "67e3c1ef2b1a7d8e9f100002"
  ],
  "bookedBy": "9876543210",
  "customerMobile": "9876543210",
  "customerEmail": "aman@example.com",
  "passengerName": "Aman Sharma",
  "paymentMethod": "UPI",
  "paymentId": "upi_123456"
}
```

### Private Booking Example

```json
{
  "userId": "USR-1001",
  "carId": "67e3c1ef2b1a7d8e9f100010",
  "sharingType": "Private",
  "vehicleType": "Car",
  "customerMobile": "9876543210",
  "customerEmail": "aman@example.com",
  "passengerName": "Aman Sharma",
  "paymentMethod": "Online",
  "paymentId": "pay_QWERTY123"
}
```

### Success Response `201`

```json
{
  "success": true,
  "message": "Booking successful",
  "data": {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingId": "AB12CD34",
    "carId": "67e3c1ef2b1a7d8e9f100010",
    "userId": "USR-1001",
    "seats": [
      "67e3c1ef2b1a7d8e9f100001"
    ],
    "totalSeatsBooked": 1,
    "basePrice": 450,
    "gstRate": 5,
    "gstAmount": 22.5,
    "price": 472.5,
    "bookingStatus": "Pending",
    "rideStatus": "AwaitingConfirmation",
    "pickupCode": "348921",
    "dropCode": "774102"
  }
}
```

### Notes

- Booking create hote hi seats reserve ho jati hain.
- Default flow me booking `Pending` rahegi aur later confirm hogi.
- `confirmOnCreate: true` sirf tab use karo jab payment aur approval same request me complete ho raha ho.
- Frontend par `pickupCode` aur `dropCode` ko operational stage ke hisaab se show karna better hai.

### Error Responses

```json
{ "message": "userId is required" }
```

```json
{ "message": "Valid carId is required" }
```

```json
{ "message": "customerMobile and customerEmail are required" }
```

```json
{ "message": "Car not found" }
```

```json
{ "message": "sharingType does not match the selected car" }
```

```json
{ "message": "vehicleType does not match the selected car" }
```

```json
{ "message": "No seats selected for shared booking" }
```

```json
{ "message": "Invalid seat id(s) provided" }
```

```json
{ "message": "One or more seats not found" }
```

```json
{ "message": "Some selected seats are already booked or unavailable" }
```

```json
{ "message": "Car is no longer available for private booking" }
```

## 11. Change Booking Status

**Method:** `PATCH`

**Endpoint:** `/travel/change-booking-status/:id`

### Request Body

```json
{
  "bookingStatus": "Confirmed"
}
```

### Allowed Status Values

- `Pending`
- `Confirmed`
- `Completed`
- `Cancelled`
- `Failed`

### Optional Fields

```json
{
  "bookingStatus": "Cancelled",
  "cancellationReason": "Customer requested cancellation",
  "assignedDriverId": "DRV-1001",
  "assignedDriverName": "Ravi Kumar",
  "isPaid": true,
  "paymentId": "pay_12345",
  "bypassCodeVerification": false
}
```

`Completed` status normal flow me drop code verify hone ke baad hi allow hota hai. Admin emergency case me `bypassCodeVerification: true` bhej sakta hai.

### Success Response `200`

```json
{
  "message": "Booking status updated successfully",
  "booking": {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingStatus": "Confirmed"
  }
}
```

### Error Responses

```json
{ "message": "Invalid booking id" }
```

```json
{ "message": "Invalid bookingStatus" }
```

```json
{ "message": "Booking not found" }
```

```json
{ "message": "Use drop code verification before marking booking completed" }
```

## 12. Get All Travel Bookings

**Method:** `GET`

**Endpoint:** `/travel/get-travels-bookings`

### Success Response `200`

```json
[
  {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingId": "AB12CD34",
    "carId": "67e3c1ef2b1a7d8e9f100010",
    "seats": [
      {
        "_id": "67e3c1ef2b1a7d8e9f100001",
        "seatType": "Window",
        "seatNumber": 1,
        "seatPrice": 450,
        "isBooked": true,
        "bookedBy": "9876543210"
      }
    ],
    "totalSeatPrice": 450,
    "bookingStatus": "Pending"
  }
]
```

If koi booking nahi hai to empty array aata hai:

```json
[]
```

## 13. Update Booking

**Method:** `PATCH`

**Endpoint:** `/travel/update-travel/booking`

### Request Body

Only in fields ko update kar sakte ho:

- `customerMobile`
- `customerEmail`
- `bookedBy`
- `bookingStatus`
- `cancellationReason`
- `assignedDriverId`
- `assignedDriverName`
- `isPaid`
- `paymentId`

```json
{
  "id": "67e3c5f42b1a7d8e9f100555",
  "data": {
    "customerMobile": "9999999999",
    "bookingStatus": "Cancelled"
  }
}
```

### Success Response `200`

```json
{
  "message": "Booking updated successfully",
  "booking": {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "customerMobile": "9999999999",
    "bookingStatus": "Cancelled"
  }
}
```

### Error Responses

```json
{ "message": "Booking ID is required" }
```

```json
{ "message": "Invalid Booking ID" }
```

```json
{ "message": "Update data is required" }
```

```json
{ "message": "Invalid update field(s): price" }
```

```json
{ "message": "Invalid bookingStatus" }
```

```json
{ "message": "Booking not found" }
```

## 13A. Confirm Travel Booking

**Method:** `PATCH`

**Endpoint:** `/travel/confirm-booking/:id`

### Request Body

```json
{
  "assignedDriverId": "DRV-1001",
  "assignedDriverName": "Ravi Kumar",
  "isPaid": true,
  "paymentId": "pay_12345"
}
```

### Success Response `200`

```json
{
  "message": "Travel booking confirmed successfully",
  "booking": {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingStatus": "Confirmed",
    "rideStatus": "AwaitingPickup",
    "pickupCode": "348921"
  }
}
```

## 13B. Verify Pickup Code

**Method:** `POST`

**Endpoint:** `/travel/verify-pickup-code/:id`

### Request Body

```json
{
  "pickupCode": "348921"
}
```

### Success Response `200`

```json
{
  "message": "Pickup code verified successfully",
  "booking": {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingStatus": "Confirmed",
    "rideStatus": "InProgress"
  }
}
```

## 13C. Verify Drop Code

**Method:** `POST`

**Endpoint:** `/travel/verify-drop-code/:id`

### Request Body

```json
{
  "dropCode": "774102"
}
```

### Success Response `200`

```json
{
  "message": "Drop code verified successfully",
  "booking": {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingStatus": "Completed",
    "rideStatus": "Completed"
  }
}
```

## 14. Get Bookings By Owner

**Method:** `GET`

**Endpoint:** `/travel/get-bookings-by/owner/:ownerId`

### Success Response `200`

```json
[
  {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "carId": "67e3c1ef2b1a7d8e9f100010",
    "availableSeatsOnCar": [
      {
        "_id": "67e3c1ef2b1a7d8e9f100001",
        "seatType": "Window",
        "isBooked": true
      }
    ],
    "seats": [
      {
        "_id": "67e3c1ef2b1a7d8e9f100001",
        "seatType": "Window",
        "seatPrice": 450
      }
    ],
    "totalSeatPrice": 450
  }
]
```

If owner ke paas cars nahi hain to:

```json
[]
```

### Error Response

```json
{ "message": "Invalid ownerId" }
```

## 15. Get Bookings By Customer Mobile

**Method:** `POST`

**Endpoint:** `/travel/get-bookings-by/bookedBy`

### Request Body

```json
{
  "customerMobile": "9876543210"
}
```

`customerMobile` query string me bhi bhej sakte ho, lekin route `POST` hai so body use karna better hai.

### Success Response `200`

```json
[
  {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingId": "AB12CD34",
    "customerMobile": "9876543210",
    "carDetails": {
      "_id": "67e3c1ef2b1a7d8e9f100010",
      "make": "Toyota",
      "model": "Innova",
      "vehicleNumber": "DL01AB1234",
      "images": [
        "https://cdn.example.com/cars/innova-front.jpg"
      ],
      "seater": 6,
      "sharingType": "Shared",
      "vehicleType": "Car",
      "bookedSeats": [
        {
          "_id": "67e3c1ef2b1a7d8e9f100001",
          "seatNumber": 1,
          "seatPrice": 450,
          "isBooked": true
        }
      ]
    }
  }
]
```

### Error Responses

```json
{ "message": "customerMobile is required" }
```

```json
{ "message": "No bookings found" }
```

## 16. Get Bookings By User Id

**Method:** `GET`

**Endpoint:** `/travel/get-bookings-by/user/:userId`

### Success Response `200`

```json
[
  {
    "_id": "67e3c5f42b1a7d8e9f100555",
    "bookingId": "AB12CD34",
    "userId": "USR-1001",
    "carDetails": {
      "_id": "67e3c1ef2b1a7d8e9f100010",
      "make": "Toyota",
      "model": "Innova",
      "vehicleNumber": "DL01AB1234",
      "images": [
        "https://cdn.example.com/cars/innova-front.jpg"
      ],
      "seater": 6,
      "sharingType": "Shared",
      "vehicleType": "Car",
      "bookedSeats": [
        {
          "_id": "67e3c1ef2b1a7d8e9f100001",
          "seatNumber": 1,
          "seatPrice": 450,
          "isBooked": true
        }
      ]
    }
  }
]
```

### Error Responses

```json
{ "message": "userId is required" }
```

```json
{ "message": "No bookings found for this user" }
```

## Rider Panel Suggested Flow

1. Car listing page ke liye `GET /travel/filter-car/by-query` use karo.
2. Car detail page ke liye `GET /travel/get-a-car/:id` use karo.
3. Shared booking seat picker ke liye `GET /travel/get-seat-data/by-id/:id` use karo.
4. Booking create karne ke liye `POST /travel/create-travel/booking` call karo.
5. Agar booking pending aaye to owner/admin side se `PATCH /travel/confirm-booking/:id` call karo.
6. Pickup par driver ya ops panel se `POST /travel/verify-pickup-code/:id` call karo.
7. Drop par `POST /travel/verify-drop-code/:id` call karo.
8. User booking history ke liye `GET /travel/get-bookings-by/user/:userId` use karo.
9. Guest lookup ya mobile based booking fetch ke liye `POST /travel/get-bookings-by/bookedBy` use karo.

## Important Implementation Notes

1. `create-travel/booking` booking create karte time seat reserve bhi karta hai.
2. Shared booking me selected seat ids valid aur unbooked hone chahiye.
3. Private booking me poori car reserve hoti hai.
4. Booking `Confirmed` hote hi ride `AwaitingPickup` stage me chali jati hai.
5. Pickup code verify hone ke baad hi ride `InProgress` hoti hai.
6. Drop code verify hone ke baad booking aur ride dono `Completed` hote hain.
7. Booking complete, cancel, ya fail hone par reserved seats release ho jati hain.
8. `get-my-cars` aur `update-a-car` controller authenticated user context expect karte hain, isliye owner-side frontend se token bhejna chahiye.
