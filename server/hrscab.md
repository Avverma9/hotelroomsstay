# HRS Cab - Partner / Rider API Documentation

This document outlines the complete, exhaustive API endpoints, request payloads, and response data structures for cab owners (partners/riders) to authenticate, manage their cabs (including full seat updates), view assigned bookings, and confirm rides via pickup and drop codes.

**Access Control Directive:** Cab partners have full access to manage their own vehicles and view their bookings. However, they **do NOT** have full modification access to the booking payload (e.g., they cannot alter a user's payment info, base price, or passenger details directly). They update booking progression strictly through the designated status/verification APIs (pickup/drop codes).

---

## 1. Partner Authentication (Login)

Rider/Partner authentication is handled via the dashboard user login endpoint.

### Login with Credentials
- **Endpoint:** `POST /login/dashboard/user`
- **Description:** Authenticates the partner. The client application **MUST** check `if (response.role === 'rider')` (or the exact designated partner role) and deny access if the role does not match.

**Request Payload (JSON):**
```json
{
  "email": "partner@example.com",
  "password": "securepassword123"
}
```

**Response Payload (JSON):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "role": "rider",
  "user": {
    "_id": "60d5f9b4c9b1f23456789abc",
    "name": "John Doe",
    "email": "partner@example.com",
    "mobile": 9876543210,
    "role": "rider",
    "status": true,
    "images": ["https://s3.amazonaws.com/bucket/profile.jpg"],
    "address": "123 Main St",
    "city": "Mumbai",
    "pinCode": 400001,
    "sidebarPermissions": {
      "mode": "role_based",
      "allowedLinkIds": [],
      "blockedLinkIds": []
    },
    "routePermissions": {
      "mode": "allow_all",
      "allowedRoutes": [],
      "blockedRoutes": []
    },
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

---

## 2. Cab Management (Car Owner API)

### 2.1 Add a Cab & Register Owner
Registers a new cab and its owner in the system simultaneously.

- **Endpoint:** `POST /travel/add-a-car`
- **Headers:** `Content-Type: multipart/form-data` (Supports image uploads for both car and owner documents)

**Request Payload (Form Data):**
*Note: Fields are sent as standard multipart form fields.*
- **Owner Details (Optional if already exists, but accepted):**
  - `ownerName` (String) - e.g., "John Doe"
  - `ownerEmail` (String) - e.g., "johndoe@example.com"
  - `ownerMobile` (Number) - e.g., `9876543210`
  - `ownerAadhar` (String)
  - `ownerPAN` (String)
  - `ownerDrivingLicence` (String)
  - `ownerAddress` (String)
  - `ownerCity` (String)
  - `ownerState` (String)
  - `ownerPinCode` (Number)
- **Cab Details:**
  - `make` (String, Required) - e.g., "Tata"
  - `model` (String, Required) - e.g., "Nexon"
  - `vehicleNumber` (String) - e.g., "MH01AB1234"
  - `vehicleType` (String, Required) - Enum: `"Bike"`, `"Car"`, `"Bus"`
  - `sharingType` (String, Required) - Enum: `"Private"`, `"Shared"`
  - `year` (Number, Required) - e.g., `2022`
  - `seater` (Number) - e.g., `4`
  - `price` (Number, Required) - Base price of the cab, e.g., `1500`
  - `color` (String, Required) - e.g., "White"
  - `fuelType` (String, Required) - Enum: `"Petrol"`, `"Diesel"`, `"Electric"`, `"Hybrid"`
  - `transmission` (String, Required) - Enum: `"Automatic"`, `"Manual"`
  - `mileage` (Number) - e.g., `15`
  - `extraKm` (Number) - Price per extra KM
  - `perPersonCost` (Number) - Cost if sharing basis
  - `pickupP` (String) - Pickup point string
  - `dropP` (String) - Drop point string
  - `pickupD` (Date String) - e.g., `"2024-12-01T10:00:00.000Z"`
  - `dropD` (Date String) - e.g., `"2024-12-01T18:00:00.000Z"`
  - `runningStatus` (String) - Enum: `"On A Trip"`, `"Available"`, `"Trip Completed"`, `"Unavailable"`
  - `seatConfig` (Stringified JSON Array) - *Only needed if sharing type requires specific seat layouts.*
    ```json
    [
      { "seatType": "Window", "seatNumber": 1, "isBooked": false, "seatPrice": 500 }
    ]
    ```
- **Files:**
  - `images` (File Array) - Images of the car/owner.
  - `dlImage` (File Array) - Driving license images.

**Response Payload (JSON):**
```json
{
  "message": "Car created successfully",
  "car": {
    "_id": "60d5f9b4c9b1f23456789def",
    "make": "Tata",
    "model": "Nexon",
    "vehicleNumber": "MH01AB1234",
    "vehicleType": "Car",
    "sharingType": "Private",
    "images": ["https://s3.amazonaws.com/bucket/car1.jpg"],
    "year": 2022,
    "seater": 4,
    "runningStatus": "Available",
    "seatConfig": [],
    "extraKm": 12,
    "perPersonCost": 0,
    "pickupP": "Mumbai Central",
    "dropP": "Pune Station",
    "pickupD": "2024-12-01T10:00:00.000Z",
    "dropD": "2024-12-01T18:00:00.000Z",
    "price": 1500,
    "color": "White",
    "mileage": 15,
    "fuelType": "Petrol",
    "transmission": "Manual",
    "ownerId": "60d5f9b4c9b1f23456789abc",
    "isAvailable": true,
    "dateAdded": "2024-01-01T12:00:00.000Z",
    "__v": 0
  }
}
```

### 2.2 Update a Cab (Seats, Price, Status)
Allows the cab partner to update their vehicle details, including modifying seat configurations, pricing, and availability status.

- **Endpoint:** `PATCH /travel/update-a-car/:id`
- **Parameters:** `id` (Cab ObjectId)
- **Headers:** `Content-Type: multipart/form-data` or `application/json`

**Request Payload (JSON or Form Data):**
```json
{
  "price": 1800,
  "runningStatus": "On A Trip",
  "isAvailable": false,
  "pickupP": "Andheri Station",
  "dropP": "Lonavala",
  "pickupD": "2024-12-05T08:00:00.000Z",
  "dropD": "2024-12-05T20:00:00.000Z",
  "seatConfig": [
    {
      "seatType": "Window",
      "seatNumber": 1,
      "isBooked": false,
      "seatPrice": 600
    },
    {
      "seatType": "Aisle",
      "seatNumber": 2,
      "isBooked": true,
      "seatPrice": 500,
      "bookedBy": "Ravi"
    }
  ]
}
```

**Response Payload (JSON):**
```json
{
  "message": "Car updated successfully",
  "car": {
    "_id": "60d5f9b4c9b1f23456789def",
    "make": "Tata",
    "model": "Nexon",
    "vehicleNumber": "MH01AB1234",
    "vehicleType": "Car",
    "sharingType": "Shared",
    "year": 2022,
    "seater": 4,
    "runningStatus": "On A Trip",
    "isAvailable": false,
    "price": 1800,
    "pickupP": "Andheri Station",
    "dropP": "Lonavala",
    "pickupD": "2024-12-05T08:00:00.000Z",
    "dropD": "2024-12-05T20:00:00.000Z",
    "seatConfig": [
      {
        "_id": "60d5f9b4c9b1f23456789ee1",
        "seatType": "Window",
        "seatNumber": 1,
        "isBooked": false,
        "seatPrice": 600
      },
      {
        "_id": "60d5f9b4c9b1f23456789ee2",
        "seatType": "Aisle",
        "seatNumber": 2,
        "isBooked": true,
        "seatPrice": 500,
        "bookedBy": "Ravi"
      }
    ],
    "color": "White",
    "fuelType": "Petrol",
    "transmission": "Manual",
    "ownerId": "60d5f9b4c9b1f23456789abc",
    "dateAdded": "2024-01-01T12:00:00.000Z",
    "__v": 1
  }
}
```

### 2.3 View Partner's Cabs
Fetches all cabs registered under a specific partner (owner).

- **Endpoint:** `GET /travel/get-a-car/by-owner/:ownerId`
- **Parameters:** `ownerId` (Owner ObjectId)

**Response Payload (JSON Array of Cars):**
```json
{
  "cars": [
    {
      "_id": "60d5f9b4c9b1f23456789def",
      "make": "Tata",
      "model": "Nexon",
      "vehicleNumber": "MH01AB1234",
      "vehicleType": "Car",
      "sharingType": "Shared",
      "year": 2022,
      "seater": 4,
      "runningStatus": "Available",
      "isAvailable": true,
      "price": 1500,
      "seatConfig": [],
      "images": ["https://s3.amazonaws.com/bucket/car1.jpg"],
      "color": "White",
      "fuelType": "Petrol",
      "transmission": "Manual",
      "ownerId": "60d5f9b4c9b1f23456789abc",
      "dateAdded": "2024-01-01T12:00:00.000Z",
      "__v": 0
    }
  ]
}
```

---

## 3. Bookings Management (Partner View)

Cab partners view their assigned bookings to know passenger details, pickup/drop locations, pricing, and statuses.

### 3.1 Get Bookings of Partner
Fetches all bookings assigned to any of the partner's cabs.

- **Endpoint:** `GET /travel/get-bookings-by/owner/:ownerId`
- **Parameters:** `ownerId` (Owner ObjectId)

**Response Payload (JSON Array of Bookings):**
```json
[
  {
    "_id": "60d5fb12c9b1f23456789fab",
    "bookingId": "B-X7Y8Z9A1",
    "carId": {
      "_id": "60d5f9b4c9b1f23456789def",
      "make": "Tata",
      "model": "Nexon",
      "vehicleNumber": "MH01AB1234",
      "vehicleType": "Car"
    },
    "userId": "usr_12345",
    "passengerName": "Alice Smith",
    "customerMobile": "9876500000",
    "customerEmail": "alice@example.com",
    "bookedBy": "Alice Smith",
    "vehicleType": "Car",
    "sharingType": "Private",
    "vehicleNumber": "MH01AB1234",
    "make": "Tata",
    "model": "Nexon",
    "color": "White",
    "pickupP": "Mumbai Airport",
    "dropP": "Taj Hotel Colaba",
    "pickupD": "2024-05-10T10:00:00.000Z",
    "dropD": "2024-05-10T12:00:00.000Z",
    "seats": ["1", "2"],
    "totalSeatsBooked": 2,
    "passengers": [
      {
        "name": "Alice Smith",
        "mobile": "9876500000",
        "email": "alice@example.com",
        "_id": "60d5fb12c9b1f23456789fac"
      }
    ],
    "basePrice": 1500,
    "gstRate": 5,
    "gstAmount": 75,
    "price": 1575,
    "paymentMode": "online",
    "paymentMethod": "Online",
    "isPaid": true,
    "paymentConfirmedAt": "2024-05-08T14:30:00.000Z",
    "phonepeOrderId": "ORD123456789",
    "paymentId": "TXN987654321",
    "bookingStatus": "Confirmed",
    "rideStatus": "Available",
    "assignedDriverId": "driver_01",
    "assignedDriverName": "Bob",
    "pickupCode": "4321",
    "dropCode": "8765",
    "pickupCodeVerifiedAt": null,
    "dropCodeVerifiedAt": null,
    "bookingDate": "2024-05-08T14:00:00.000Z",
    "createdAt": "2024-05-08T14:00:00.000Z",
    "updatedAt": "2024-05-08T14:30:00.000Z",
    "__v": 0
  }
]
```

---

## 4. Ride Confirmation & Code Verification

Partners cannot manually edit the core financial/user details of the booking. They strictly use the designated code verification endpoints to confirm the progression of the ride from "Pickup" to "Drop/Complete".

### 4.1 Verify Pickup Code (Start Ride)
The partner verifies the 4-digit pickup code provided by the rider at the time of pickup. This validates that the ride has officially started.

- **Endpoint:** `POST /travel/verify-pickup-code/:id`
- **Parameters:** `id` (Booking ObjectId)

**Request Payload (JSON):**
```json
{
  "pickupCode": "4321"
}
```

**Response Payload (JSON):**
```json
{
  "message": "Pickup code verified successfully",
  "booking": {
    "_id": "60d5fb12c9b1f23456789fab",
    "bookingId": "B-X7Y8Z9A1",
    "bookingStatus": "Confirmed",
    "rideStatus": "Ride in Progress",
    "pickupCode": "4321",
    "dropCode": "8765",
    "pickupCodeVerifiedAt": "2024-05-10T10:05:00.000Z",
    "dropCodeVerifiedAt": null,
    "rideStartedAt": "2024-05-10T10:05:00.000Z",
    "updatedAt": "2024-05-10T10:05:00.000Z"
    // ... other full booking fields as shown above
  }
}
```

### 4.2 Verify Drop Code (End Ride)
The partner verifies the 4-digit drop code provided by the rider at the end of the trip. This step is strictly required before the ride can be marked as `Completed`.

- **Endpoint:** `POST /travel/verify-drop-code/:id`
- **Parameters:** `id` (Booking ObjectId)

**Request Payload (JSON):**
```json
{
  "dropCode": "8765"
}
```

**Response Payload (JSON):**
```json
{
  "message": "Drop code verified successfully",
  "booking": {
    "_id": "60d5fb12c9b1f23456789fab",
    "bookingId": "B-X7Y8Z9A1",
    "bookingStatus": "Completed",
    "rideStatus": "Ride Completed",
    "pickupCode": "4321",
    "dropCode": "8765",
    "pickupCodeVerifiedAt": "2024-05-10T10:05:00.000Z",
    "dropCodeVerifiedAt": "2024-05-10T12:30:00.000Z",
    "rideCompletedAt": "2024-05-10T12:30:00.000Z",
    "updatedAt": "2024-05-10T12:30:00.000Z"
    // ... other full booking fields
  }
}
```

### 4.3 Change Booking Status (Fallback / Limited Modification)
Used for basic status progression. **Note:** Transitioning the status to `"Completed"` directly throws an error if the `dropCode` has not been verified first.

- **Endpoint:** `PATCH /travel/change-booking-status/:id`
- **Parameters:** `id` (Booking ObjectId)

**Request Payload (JSON):**
```json
{
  "bookingStatus": "Completed"
}
```

**Response Payload (JSON):**
*(On Success if Drop Code was verified)*
```json
{
  "message": "Booking status updated successfully",
  "booking": {
    "_id": "60d5fb12c9b1f23456789fab",
    "bookingStatus": "Completed",
    "rideStatus": "Ride Completed",
    "updatedAt": "2024-05-10T12:35:00.000Z"
    // ... other full booking fields
  }
}
```

*(On Error if Drop Code is NOT verified)*
```json
{
  "message": "Use drop code verification before marking booking completed"
}
```