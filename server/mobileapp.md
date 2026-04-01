# 📱 HotelRoomsStay — Mobile App API Documentation


**Base URL (Prod):** `https://hotelroomsstay.com/api`

---

## 🔐 Authentication & Headers

Har protected API call me header me JWT token bhejna zaroori hai:

```
Authorization: <JWT_TOKEN>
```

> **Skip-auth routes:** `/signIn`, `/Signup`, `/signIn/google`, `/send-otp`, `/verify-otp`, `/mail/send-otp`, `/mail/verify-otp`, `/health`  
> In routes pe token ki zaroorat nahi.

Token 24 ghante valid rehta hai. Token expire hone par `403` response aayega — app ko fir se login karwana hoga.

---

# 1️⃣ AUTH APIs

---

## 1.1 POST `/Signup`

**Purpose:** Naya user register karna  
**Content-Type:** `multipart/form-data` (agar profile image ho) ya `application/json`

### Request Body

| Key        | Type     | Required | Description               |
|------------|----------|----------|---------------------------|
| `userName` | String   | No       | User ka display name      |
| `email`    | String   | No       | Unique email              |
| `mobile`   | String   | No       | Unique mobile number      |
| `password` | String   | No       | Password                  |
| `address`  | String   | No       | User ka address           |
| `images`   | File[]   | No       | Profile images (multipart)|

### Response `201`

```json
{
  "status": true,
  "message": "User has been created successfully",
  "data": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "userId": "45678901",
    "userName": "Rahul Kumar",
    "email": "rahul@example.com",
    "mobile": "9876543210",
    "password": "hashed",
    "address": "Delhi",
    "images": ["https://s3.amazonaws.com/...image.jpg"],
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  }
}
```

### Error Responses

| Code | Message                        |
|------|--------------------------------|
| 400  | `Email is already in use`      |
| 400  | `Mobile number is already in use` |
| 500  | `Internal Server Error`        |

### Flow
1. Client form fill karke POST karta hai
2. Server check karta hai duplicate email/mobile
3. User create hota hai, Welcome50 coupon auto-assign hota hai (Rs 50, 7 din valid)
4. Notification bhi user ko jaata hai coupon ke baare me

### 📱 UI Spec
- **Screen:** Registration Screen
- Fields: Name, Email, Mobile, Password, Profile Image upload
- Validation: Email format, mobile 10 digit, password strength
- On success → auto-login ya navigate to Login screen
- Toast: "Account created successfully!"
- Error toast for duplicate email/mobile

---

## 1.2 POST `/signIn`

**Purpose:** Email + Password se login  
**Content-Type:** `application/json`

### Request Body

| Key        | Type   | Required | Description     |
|------------|--------|----------|-----------------|
| `email`    | String | Yes      | User ka email   |
| `password` | String | Yes      | User ka password|

### Response `200`

```json
{
  "message": "Sign-in successful",
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "userId": "45678901",
  "mobile": "9876543210",
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "rsToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

| Code | Message                     |
|------|-----------------------------|
| 401  | `Invalid email or password` |
| 500  | `Internal server error`     |

### Flow
1. User email & password daalke submit
2. Server case-insensitive email match karega
3. Password plaintext match hoga
4. JWT token generate hota hai (24h expiry)
5. Token + user info return

### 📱 UI Spec
- **Screen:** Login Screen
- Fields: Email, Password (show/hide toggle)
- "Forgot Password?" → OTP screen
- "Sign In with Google" button → `/signIn/google`
- "Don't have account? Sign Up" → Signup screen
- On success: Store `rsToken` in secure storage, store `userId`, navigate to Home
- Error: Show inline error below form

---

## 1.3 POST `/send-otp`

**Purpose:** Phone number OTP for login (Twilio SMS)  
**Content-Type:** `application/json`

### Request Body

| Key           | Type   | Required | Description                         |
|---------------|--------|----------|-------------------------------------|
| `phoneNumber` | String | Yes      | Full phone with country code: `+919876543210` |

### Response `200`

```json
{
  "success": true,
  "sid": "VE1234567890abcdef",
  "status": "pending"
}
```

### Error Responses

| Code | Message                              |
|------|--------------------------------------|
| 404  | `Please register yourself`           |
| 500  | `Internal Server Error`              |

### Flow
1. User apna mobile number daalega
2. Server check karega ki user registered hai ya nahi
3. Twilio se SMS OTP jaayega
4. User `/verify-otp` se verify karega

### 📱 UI Spec
- **Screen:** OTP Login Screen (Tab 1: SMS OTP)
- Input: Phone number with country code picker
- Button: "Send OTP"
- On success → Navigate to OTP input screen
- Loading state during API call

---

## 1.4 POST `/verify-otp`

**Purpose:** Phone OTP verify karke login  
**Content-Type:** `application/json`

### Request Body

| Key           | Type   | Required | Description                |
|---------------|--------|----------|----------------------------|
| `phoneNumber` | String | Yes      | Same number jis pe OTP gaya|
| `code`        | String | Yes      | 6-digit OTP code           |

### Response `200`

```json
{
  "result": {
    "success": true,
    "status": "approved"
  },
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "userId": "45678901",
  "mobile": "9876543210",
  "email": "rahul@example.com",
  "rsToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

| Code | Message                    |
|------|----------------------------|
| 400  | `OTP verification failed`  |
| 404  | `User not found`           |
| 500  | `Internal Server Error`    |

### Flow
1. User 6-digit OTP enter karega
2. Twilio verify karega
3. Success par JWT token milega (24h)
4. Auto-resend button 60s ke baad enable hona chahiye

### 📱 UI Spec
- **Screen:** OTP Verification Screen
- 6-digit OTP input (auto-focus, auto-submit on last digit)
- Timer: 60s countdown for resend
- "Resend OTP" button after timer
- On success: Store token + navigate to Home

---

## 1.5 POST `/mail/send-otp`

**Purpose:** Email OTP bhejne ke liye (Login via email)  
**Content-Type:** `application/json`

### Request Body

| Key         | Type   | Required | Description                        |
|-------------|--------|----------|------------------------------------|
| `email`     | String | Yes      | User ki registered email           |
| `loginType` | String | Yes      | `"user"` for mobile app users      |

### Response `200`

```json
{
  "message": "OTP sent successfully"
}
```

### Error Responses

| Code | Message                                        |
|------|------------------------------------------------|
| 400  | `Email is required`                            |
| 400  | `loginType must be either user or dashboard`   |
| 400  | `No user account found with this email`        |
| 500  | `Invalid Email`                                |

### Flow
1. User email enter karta hai + loginType `"user"` bhejta hai
2. Server check karta hai ki user exist karta hai
3. 6-digit OTP email pe jaata hai (10 min valid)
4. OTP server ki memory me store hota hai

### 📱 UI Spec
- **Screen:** OTP Login Screen (Tab 2: Email OTP)
- Input: Email field
- Hidden field: `loginType` = `"user"` (hardcoded)
- Button: "Send OTP"
- On success → Navigate to Email OTP verify screen

---

## 1.6 POST `/mail/verify-otp`

**Purpose:** Email OTP verify karke login  
**Content-Type:** `application/json`

### Request Body

| Key         | Type   | Required | Description                  |
|-------------|--------|----------|------------------------------|
| `email`     | String | Yes      | Same email jis pe OTP gaya   |
| `otp`       | String | Yes      | 6-digit OTP                  |
| `loginType` | String | Yes      | `"user"` for mobile app      |

### Response `200`

```json
{
  "role": "user",
  "message": "Logged in successfully",
  "userId": "45678901",
  "rsToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "rahul@example.com",
  "mobile": "9876543210"
}
```

### Error Responses

| Code | Message                                     |
|------|---------------------------------------------|
| 400  | `Email and OTP are required`                |
| 400  | `OTP not found for this email...`           |
| 400  | `OTP has expired`                           |
| 400  | `Invalid OTP`                               |
| 400  | `No user account found with this email`     |
| 500  | `Internal server error`                     |

### Flow
1. User email + OTP + loginType `"user"` bhejta hai
2. Server stored OTP se match karta hai
3. Match hone par JWT token milta hai (24h expiry)

### 📱 UI Spec
- **Screen:** Email OTP Verification Screen
- 6-digit OTP input field
- "Resend OTP" with 60s cooldown timer
- On success: Store `rsToken`, `userId` → navigate to Home

---

# 2️⃣ USER APIs

---

## 2.1 GET `/get/:userId`

**Purpose:** User ki profile details lena  
**Auth Required:** Yes

### Request

| Param    | Type   | In    | Required | Description       |
|----------|--------|-------|----------|-------------------|
| `userId` | String | Path  | Yes      | User's 8-digit ID |

### Response `200`

```json
{
  "status": true,
  "message": "Users Profile Details",
  "data": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "uid": "firebase-uid-123",
    "userId": "45678901",
    "userName": "Rahul Kumar",
    "images": ["https://s3.amazonaws.com/...profile.jpg"],
    "address": "123 Main Street, Delhi",
    "email": "rahul@example.com",
    "mobile": "9876543210",
    "password": "abc123",
    "createdAt": "2026-01-15T08:30:00.000Z",
    "updatedAt": "2026-03-20T14:00:00.000Z"
  }
}
```

### Error Responses

| Code | Message                 |
|------|-------------------------|
| 404  | `userId does not exist` |
| 500  | Error message           |

### Flow
1. App stored userId se GET call karega
2. Server MongoDB me findOne karega
3. Full user document return hoga

### 📱 UI Spec
- **Screen:** Profile Screen
- Display: Avatar (images[0]), Name, Email, Mobile, Address
- Edit button → Edit Profile screen
- Pull-to-refresh
- Skeleton loader while loading

---

## 2.2 PUT `/update`

**Purpose:** User profile update karna  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data` (image upload) ya `application/json`

### Request Body

| Key        | Type   | Required | Description                    |
|------------|--------|----------|--------------------------------|
| `userId`   | String | Yes      | User ka ID (mandatory)         |
| `userName` | String | No       | Naya name                      |
| `email`    | String | No       | Naya email (unique check hota) |
| `mobile`   | String | No       | Naya mobile (unique check)     |
| `password` | String | No       | Naya password                  |
| `address`  | String | No       | Naya address                   |
| `images`   | File[] | No       | Naya profile images (multipart)|

### Response `200`

```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "uid": "firebase-uid-123",
  "userId": "45678901",
  "userName": "Rahul New Name",
  "images": ["https://s3.amazonaws.com/...new-profile.jpg"],
  "address": "456 New Street, Mumbai",
  "email": "rahul_new@example.com",
  "mobile": "9876543211",
  "password": "newpass123",
  "createdAt": "2026-01-15T08:30:00.000Z",
  "updatedAt": "2026-04-01T12:00:00.000Z"
}
```

### Error Responses

| Code | Message                                          |
|------|--------------------------------------------------|
| 400  | `userId is required`                             |
| 400  | `Email is already in use by another user`        |
| 400  | `Mobile number is already in use by another user`|
| 404  | `User not found`                                 |
| 500  | `Internal server error`                          |

### Flow
1. User profile fields edit karke submit karta hai
2. Server duplicate email/mobile check karega dusre users se
3. Password change hone par notification jaata hai user ko
4. Updated user object return hota hai

### 📱 UI Spec
- **Screen:** Edit Profile Screen
- Pre-filled fields: Name, Email, Mobile, Address, Password
- Profile photo change: Camera / Gallery picker
- Save button → Loading state → Success toast → Navigate back
- Inline validation errors

---

# 3️⃣ HOTEL APIs

---

## 3.1 GET `/hotels/filters`

**Purpose:** Hotels search & filter karna with pricing, availability, GST — Main search API  
**Auth Required:** Yes

### Query Parameters

| Key              | Type    | Required | Description                              |
|------------------|---------|----------|------------------------------------------|
| `search`         | String  | No       | Free text search (city/state/name/landmark) |
| `city`           | String  | No       | City name                                |
| `state`          | String  | No       | State name                               |
| `destination`    | String  | No       | Destination                              |
| `starRating`     | Number  | No       | Exact star rating                        |
| `minStarRating`  | Number  | No       | Minimum star rating                      |
| `maxStarRating`  | Number  | No       | Maximum star rating                      |
| `propertyType`   | String  | No       | Comma-separated: `Hotel,Resort`          |
| `amenities`      | String  | No       | Comma-separated: `WiFi,Pool`             |
| `bedTypes`       | String  | No       | Bed types filter                         |
| `roomType`       | String  | No       | Room type filter                         |
| `minRoomPrice`   | Number  | No       | Min room price                           |
| `maxRoomPrice`   | Number  | No       | Max room price                           |
| `checkInDate`    | String  | No       | `YYYY-MM-DD` — availability check        |
| `checkOutDate`   | String  | No       | `YYYY-MM-DD` — availability check        |
| `guests`         | Number  | No       | Guest count filter                       |
| `countRooms`     | Number  | No       | Required rooms count (default: 1)        |
| `onlyAvailable`  | Boolean | No       | `true` = only available hotels           |
| `hasOffer`       | Boolean | No       | `true` = only rooms with offers          |
| `sortBy`         | String  | No       | `price`, `starRating`, `rating`, `createdAt` |
| `sortOrder`      | String  | No       | `asc` / `desc`                           |
| `page`           | Number  | No       | Page number (default: 1)                 |
| `limit`          | Number  | No       | Items per page (default: 10)             |

### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "665b...",
      "hotelId": "12345678",
      "hotelName": "Grand Palace Hotel",
      "description": "Luxury hotel in the heart of city",
      "hotelOwnerName": "Mr. Sharma",
      "destination": "Jaipur",
      "onFront": true,
      "state": "Rajasthan",
      "city": "Jaipur",
      "latitude": "26.9124",
      "longitude": "75.7873",
      "landmark": "Near Hawa Mahal",
      "pinCode": 302001,
      "hotelCategory": "Luxury",
      "starRating": "4",
      "propertyType": ["Hotel"],
      "contact": 9876543210,
      "isAccepted": true,
      "images": ["https://s3.../hotel1.jpg", "https://s3.../hotel2.jpg"],
      "rating": 4.2,
      "reviewCount": 56,
      "ratingBreakdown": {
        "cleanliness": 4.5,
        "service": 4.0,
        "valueForMoney": 4.1,
        "location": 4.3
      },
      "ratingDistribution": {
        "oneStar": 2,
        "twoStar": 3,
        "threeStar": 8,
        "fourStar": 25,
        "fiveStar": 18
      },
      "rooms": [
        {
          "roomId": "abc12345",
          "type": "Deluxe",
          "bedTypes": "Double",
          "price": 2500,
          "originalPrice": 3000,
          "isOffer": true,
          "offerName": "Summer Sale",
          "offerPriceLess": 500,
          "offerExp": "2026-06-30T00:00:00.000Z",
          "countRooms": 5,
          "totalRooms": 8,
          "soldOut": false,
          "images": ["https://s3.../room1.jpg"]
        }
      ],
      "amenities": [{"amenities": "WiFi"}, {"amenities": "Pool"}],
      "foods": [
        {
          "foodId": "f001",
          "name": "Breakfast Buffet",
          "price": 500,
          "foodType": "Veg"
        }
      ],
      "policies": [
        {
          "hotelsPolicy": "No smoking in rooms",
          "checkInPolicy": "12:00 PM",
          "checkOutPolicy": "11:00 AM",
          "cancellationPolicy": "Free cancellation before 24 hours",
          "petsAllowed": false,
          "smokingAllowed": false,
          "alcoholAllowed": true
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalHotels": 48,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Flow
1. User search/filter form bharta hai
2. API call with query params
3. Server MongoDB me filter + sort + paginate karega
4. Rooms ki pricing monthly price check karega
5. Offer/discount applied price return hoga
6. Only `isAccepted: true` hotels return honge by default

### 📱 UI Spec
- **Screen:** Hotel Search / Listing Screen
- **Top Section:** Search bar (city/destination), Date picker (check-in/check-out), Guest & Room count
- **Filter Bottom Sheet/Modal:**
  - Star Rating (1-5 chip selector)
  - Property Type (Hotel/Resort/Homestay)
  - Price Range slider (min-max)
  - Amenities multi-select chips
  - Room Type / Bed Type
  - Sort by: Price / Rating / Newest
- **List:** Hotel cards with:
  - Hotel image (carousel), Name, Star rating
  - City, Landmark
  - Starting price (lowest room price)
  - Offer badge if any room has offer
  - Rating badge
  - "View" button → Hotel Detail screen
- Pagination: Infinite scroll ya Load More button
- Empty state: "No hotels found" illustration

---

## 3.2 GET `/hotels/with-active-offers`

**Purpose:** Hotels jinme active offers/coupons lage hain  
**Auth Required:** Yes

### Query Parameters
None required.

### Response `200`

```json
[
  {
    "hotelId": "12345678",
    "hotelName": "Grand Palace Hotel",
    "rooms": [
      {
        "roomId": "abc12345",
        "type": "Deluxe",
        "price": 2500,
        "originalPrice": 3000,
        "isOffer": true,
        "offerName": "Summer Sale",
        "offerPriceLess": 500,
        "offerExp": "2026-06-30"
      }
    ],
    "images": ["https://s3.../hotel.jpg"],
    "city": "Jaipur",
    "state": "Rajasthan",
    "starRating": "4"
  }
]
```

### Flow
1. Server sabhi hotels jinki rooms me `isOffer: true` hai, woh return karta hai
2. Hotels with active coupon offers dikhte hain

### 📱 UI Spec
- **Screen:** Offers / Deals Section (Home screen section)
- Horizontal scrollable cards with offer badge
- "X% OFF" or "Save ₹500" badge on cards
- Tapping → Hotel Detail page

---

## 3.3 GET `/hotels/get-by-id/:hotelId`

**Purpose:** Single hotel ki complete details with room pricing, GST, offers, availability  
**Auth Required:** Yes

### Request

| Param        | Type   | In    | Required | Description |
|--------------|--------|-------|----------|-------------|
| `hotelId`    | String | Path  | Yes      | Hotel ID    |

### Query Parameters

| Key           | Type   | Required | Description                    |
|---------------|--------|----------|--------------------------------|
| `checkInDate` | String | No       | `YYYY-MM-DD` for availability  |
| `checkOutDate`| String | No       | `YYYY-MM-DD` for availability  |
| `countRooms`  | Number | No       | Required rooms (default: 1)    |

### Response `200`

```json
{
  "_id": "665b...",
  "hotelId": "12345678",
  "isAccepted": true,
  "onFront": true,
  "localId": "Accepted",
  "destination": "Jaipur",
  "rating": 4.2,
  "reviewCount": 56,
  "ratingBreakdown": {
    "cleanliness": 4.5,
    "service": 4.0,
    "valueForMoney": 4.1,
    "location": 4.3
  },
  "ratingDistribution": {
    "oneStar": 2, "twoStar": 3, "threeStar": 8, "fourStar": 25, "fiveStar": 18
  },
  "customerWelcomeNote": "Welcome to Grand Palace!",
  "availability": {
    "totalRooms": 20,
    "availableRooms": 12,
    "status": "Available",
    "isFullyBooked": false
  },
  "basicInfo": {
    "name": "Grand Palace Hotel",
    "owner": "Mr. Sharma",
    "description": "Luxury hotel...",
    "category": "Luxury",
    "starRating": 4,
    "propertyType": ["Hotel"],
    "images": ["https://s3.../hotel1.jpg"],
    "location": {
      "address": "Near Hawa Mahal",
      "city": "Jaipur",
      "state": "Rajasthan",
      "pinCode": "302001",
      "coordinates": { "lat": "26.9124", "lng": "75.7873" }
    },
    "contact": 9876543210
  },
  "rooms": [
    {
      "id": "abc12345",
      "roomId": "abc12345",
      "name": "Deluxe Room",
      "type": "Deluxe",
      "bedType": "Double",
      "images": ["https://s3.../room.jpg"],
      "inventory": {
        "total": 8,
        "available": 5,
        "isSoldOut": false
      },
      "pricing": {
        "basePrice": 3000,
        "taxPercent": 12,
        "taxAmount": 360,
        "finalPrice": 3360,
        "currency": "₹",
        "displayPrice": "₹ 3,360"
      },
      "features": {
        "isOffer": true,
        "offerText": "Summer Sale"
      },
      "amenities": ["WiFi", "AC", "TV"],
      "description": "Spacious room with garden view"
    }
  ],
  "foods": [
    {
      "id": "f001",
      "name": "Breakfast Buffet",
      "type": "Veg",
      "description": "South Indian + Continental",
      "images": [],
      "price": 500,
      "currency": "₹",
      "displayPrice": "₹ 500"
    }
  ],
  "amenities": ["WiFi", "Swimming Pool", "Gym", "Parking"],
  "policies": {
    "checkIn": "12:00 PM",
    "checkOut": "11:00 AM",
    "rules": ["No smoking", "ID proof mandatory at check-in"],
    "restrictions": {
      "petsAllowed": false,
      "smokingAllowed": false,
      "alcoholAllowed": true
    },
    "cancellationText": "Free cancellation before 24 hours",
    "detailed": { "...all policy fields..." }
  }
}
```

### Flow
1. User hotel card pe tap karta hai
2. API call with hotelId + optional dates
3. Server hotel + rooms + monthly prices + GST + offers + bookings (availability) fetch karta hai
4. Processed rooms with pricing, tax, availability return hote hain

### 📱 UI Spec
- **Screen:** Hotel Detail Screen
- **Top:** Image carousel (swipeable), Back button, Share & Wishlist icons
- **Header Section:** Hotel name, Star rating (stars), City, Rating badge with reviewCount
- **Welcome Note:** Card if available
- **Availability Banner:** "Available" (green) / "Fully Booked" (red)
- **Rooms Section:** Cards for each room:
  - Room image, Room type, Bed type
  - Price: ~~₹3000~~ ₹2500 (if offer)
  - Tax info: "+₹360 taxes"
  - Available count: "5 rooms left"
  - "SOLD OUT" badge if unavailable
  - "Select Room" button
- **Food Section:** Food cards with image, name, price, "Add to order"
- **Amenities Section:** Icon grid (WiFi, Pool, Gym, etc.)
- **Policies Section:** Check-in/check-out time, Rules list, Restrictions icons
- **Location:** Map preview with coordinates
- **Reviews Section:** Rating breakdown bars, review count
- **Bottom CTA:** "Book Now" sticky button

---

## 3.4 GET `/get/offers/main/hotels`

**Purpose:** Featured hotels (onFront=true) with monthly pricing  
**Auth Required:** Yes

### Query Parameters

| Key            | Type   | Required | Description          |
|----------------|--------|----------|----------------------|
| `checkInDate`  | String | No       | Date for pricing     |
| `checkOutDate` | String | No       | Date for pricing     |

### Response `200`

```json
[
  {
    "hotelId": "12345678",
    "hotelName": "Grand Palace Hotel",
    "onFront": true,
    "images": ["..."],
    "city": "Jaipur",
    "state": "Rajasthan",
    "starRating": "4",
    "rooms": [
      {
        "roomId": "abc12345",
        "type": "Deluxe",
        "price": 2200,
        "originalPrice": 3000,
        "monthlyPriceDetails": {
          "monthPrice": 2200,
          "startDate": "2026-04-01",
          "endDate": "2026-04-30",
          "validForBooking": true
        }
      }
    ]
  }
]
```

### Flow
1. Home screen pe featured hotels section load hota hai
2. Server `onFront: true` hotels dhundhta hai
3. Monthly pricing agar available hai toh room price override hoti hai

### 📱 UI Spec
- **Screen:** Home Screen → Featured Hotels Section
- Horizontal carousel or vertical list
- Card: Hotel image, Name, City, Starting price, Offer badge
- "View All" navigation button

---

# 4️⃣ HOTEL BOOKING APIs

---

## 4.1 POST `/booking/:userId/:hotelId`

**Purpose:** Hotel room book karna  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data` ya `application/json`

### Path Params

| Param     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `userId`  | String | Yes      | User ID     |
| `hotelId` | String | Yes      | Hotel ID    |

### Request Body

| Key              | Type     | Required | Description                              |
|------------------|----------|----------|------------------------------------------|
| `checkInDate`    | String   | Yes      | `YYYY-MM-DD`                             |
| `checkOutDate`   | String   | Yes      | `YYYY-MM-DD`                             |
| `guests`         | Number   | Yes      | Number of guests                         |
| `guestDetails`   | Object   | No       | `{fullName, mobile, email}`              |
| `numRooms`       | Number   | Yes      | Number of rooms                          |
| `roomDetails`    | Array    | Yes      | `[{roomId, type, bedTypes, price}]`      |
| `foodDetails`    | Array    | No       | `[{foodId, name, price, quantity}]`      |
| `couponCode`     | String   | No       | Applied coupon code                      |
| `discountPrice`  | Number   | No       | Discount amount from coupon              |
| `pm`             | String   | No       | `"online"` / `"offline"`                 |
| `bookingSource`  | String   | No       | `"app"` / `"website"` / `"panel"`        |
| `hotelDetails`   | Object   | No       | `{hotelName, hotelEmail, hotelCity, hotelOwnerName, destination}` |

### Response `201`

```json
{
  "success": true,
  "data": {
    "bookingId": "A1B2C3D4E5",
    "user": {
      "userId": "45678901",
      "profile": ["https://s3.../profile.jpg"],
      "name": "Rahul Kumar",
      "email": "rahul@example.com",
      "mobile": "9876543210"
    },
    "hotelDetails": {
      "hotelCity": "Jaipur",
      "hotelId": "12345678",
      "hotelName": "Grand Palace Hotel",
      "hotelEmail": "hotel@example.com",
      "hotelOwnerName": "Mr. Sharma",
      "destination": "Jaipur"
    },
    "checkInDate": "2026-04-15",
    "checkOutDate": "2026-04-17",
    "guests": 2,
    "guestDetails": {
      "fullName": "Rahul Kumar",
      "mobile": "9876543210",
      "email": "rahul@example.com"
    },
    "numRooms": 1,
    "roomDetails": [
      {
        "roomId": "abc12345",
        "type": "Deluxe",
        "bedTypes": "Double",
        "price": 3000
      }
    ],
    "foodDetails": [
      {
        "foodId": "f001",
        "name": "Breakfast Buffet",
        "price": 500,
        "quantity": 2
      }
    ],
    "baseRoomPrice": 6000,
    "discountedRoomPrice": 5950,
    "gstPrice": 12,
    "gstAmount": 714,
    "foodPrice": 1000,
    "price": 7664,
    "couponCode": "123456",
    "discountPrice": 50,
    "bookingStatus": "Pending",
    "paymentMode": "online",
    "isPaid": false,
    "bookingSource": "app",
    "destination": "Jaipur",
    "createdAt": "2026-04-01T10:30:00.000Z"
  }
}
```

### Booking Status Values
- `Pending` — payment nahi hua (online bookings by default)
- `Confirmed` — payment ho gaya / offline booking
- `Checked-in` — guest arrived
- `Checked-out` — guest left
- `Cancelled` — booking cancel
- `Failed` — payment failed
- `No-Show` — guest nahi aaya

### Flow
1. User room select karta hai, dates confirm karta hai
2. API call with all details
3. Server user verify karta hai, pricing calculate karta hai (GST auto)
4. Room inventory decrement hota hai
5. Booking create hota hai + email jaata hai
6. Notification user ko jaata hai
7. **Online payment:** Booking `Pending` status me rehta hai → PhonePe payment flow start karna hoga via `/payment/create-order/hotel/:bookingId`
8. **Offline:** Admin se confirmed aa sakta hai

### 📱 UI Spec
- **Screen:** Booking Confirmation Screen
- **Step 1:** Review booking summary:
  - Hotel name, Room type, Dates, Guests, Food orders
  - Price breakdown: Room ₹X × N nights = ₹Y | Discount -₹Z | GST +₹W | Food +₹F | **Total: ₹T**
- **Step 2:** Guest details form (name, mobile, email)
- **Step 3:** Coupon code input field with "Apply" button
- **Step 4:** Payment method selection (Online / Pay at Hotel)
- **CTA:** "Confirm Booking" → Loading → Success animation
- On success (online): Navigate to PhonePe payment screen
- On success (offline): Navigate to Booking confirmation with ID

---

## 4.2 GET `/get/all/users-filtered/booking/by`

**Purpose:** User ki hotel bookings list (paginated)  
**Auth Required:** Yes

### Query Parameters

| Key              | Type   | Required | Description                |
|------------------|--------|----------|----------------------------|
| `userId`         | String | Yes      | User ID                    |
| `bookingStatus`  | String | No       | Filter: `Confirmed`, `Cancelled`, `Pending`, `all` |
| `page`           | Number | No       | Page number (default: 1)   |
| `limit`          | Number | No       | Items per page (default: 10)|

### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "bookingId": "A1B2C3D4E5",
      "user": { "userId": "45678901", "name": "Rahul", "email": "...", "mobile": "..." },
      "hotelDetails": { "hotelName": "Grand Palace", "hotelId": "12345678", "destination": "Jaipur" },
      "checkInDate": "2026-04-15",
      "checkOutDate": "2026-04-17",
      "guests": 2,
      "numRooms": 1,
      "roomDetails": [{"roomId": "abc12345", "type": "Deluxe", "bedTypes": "Double", "price": 3000}],
      "foodDetails": [{"foodId": "f001", "name": "Breakfast", "price": 500, "quantity": 2}],
      "price": 7664,
      "bookingStatus": "Confirmed",
      "paymentMode": "online",
      "isPaid": true,
      "couponCode": "123456",
      "discountPrice": 50,
      "createdAt": "2026-04-01T10:30:00.000Z"
    }
  ],
  "html": "<div>...server-rendered booking cards HTML...</div>",
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalBookings": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Flow
1. User "My Bookings" tab kholega
2. API call with userId + optional status filter
3. Server paginated bookings return karega sorted by latest first

### 📱 UI Spec
- **Screen:** My Bookings Screen (Tab: Hotels)
- **Tab bar:** All | Confirmed | Pending | Cancelled
- **Booking Card:**
  - Hotel name, Destination
  - Check-in → Check-out dates
  - Guests count, Room type
  - Total price (₹ formatted)
  - Status badge (color-coded: green=Confirmed, yellow=Pending, red=Cancelled)
  - "View Ticket" button, "Print" button
  - "Review" button (if checked-out & no review given)
- Pagination: Infinite scroll
- Empty state: "No bookings found" with illustration

---

## 4.3 GET `/monthly-set-room-price/get/by/:hotelId`

**Purpose:** Hotel ke rooms ki monthly special pricing lena  
**Auth Required:** Yes

### Path Params

| Param     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `hotelId` | String | Yes      | Hotel ID    |

### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "665c...",
      "hotelId": "12345678",
      "roomId": "abc12345",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "monthPrice": 2200,
      "roomType": "Deluxe",
      "roomBedType": "Double",
      "createdAt": "2026-03-15T00:00:00.000Z"
    }
  ]
}
```

### Error Responses

| Code | Message                                       |
|------|-----------------------------------------------|
| 404  | `No monthly prices found for the specified hotelId` |
| 404  | `Hotel not found`                            |
| 500  | `Internal server error`                       |

### Flow
1. Hotel detail screen load hote waqt ye API bhi call hoti hai
2. Agar current dates ke liye monthly price set hai toh room price override dikhani hai

### 📱 UI Spec
- Used internally within Hotel Detail screen for price display
- Show ~~₹Original~~ ₹Monthly if monthly price is lower

---

## 4.4 GET `/gst/get-single-gst`

**Purpose:** GST rate fetch karna by type and threshold  
**Auth Required:** Yes

### Query Parameters

| Key            | Type   | Required | Description                 |
|----------------|--------|----------|-----------------------------|
| `type`         | String | No       | `Hotel`, `Tour`, `Travel`   |
| `gstThreshold` | Number | No       | Room price for slab matching|

### Response `200`

```json
{
  "_id": "665d...",
  "gstPrice": 12,
  "gstMinThreshold": 1000,
  "gstMaxThreshold": 7500,
  "type": "Hotel",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### Error Responses

| Code | Response |
|------|----------|
| 404  | `0`      |
| 500  | Error    |

### Flow
1. Booking flow me price calculate karte waqt GST lena hota hai
2. Room price as threshold pass hota hai
3. Slab match hone par `gstPrice` (percentage) milta hai

### GST Logic
- Price ≤ `gstMinThreshold` → 0% GST
- Price `gstMinThreshold` to `gstMaxThreshold` → `gstPrice`% (typically 12%)
- Price > `gstMaxThreshold` → 18% GST

### 📱 UI Spec
- Used internally in booking price calculator
- Show on booking summary: "GST @12%: ₹360"

---

# 5️⃣ TOUR APIs

---

## 5.1 GET `/get-all-tours`

**Purpose:** Sab accepted tours list (paginated)  
**Auth Required:** Yes

### Query Parameters

| Key         | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| `page`      | Number | No       | Page number (default: 1)             |
| `limit`     | Number | No       | Per page (default: 10, max: 100)     |
| `sortBy`    | String | No       | `createdAt`, `price`, `starRating`, `nights`, `tourStartDate` |
| `sortOrder` | String | No       | `asc` / `desc`                       |

### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "665e...",
      "travelAgencyName": "Indian Adventures",
      "agencyPhone": "9876543210",
      "agencyEmail": "info@indianadv.com",
      "isAccepted": true,
      "country": "India",
      "state": "Rajasthan",
      "city": "Jaipur",
      "visitngPlaces": "2N Jaipur | 1N Udaipur | 2N Jodhpur",
      "themes": "Heritage,Adventure",
      "price": 15000,
      "nights": 5,
      "days": 6,
      "from": "2026-05-01T00:00:00.000Z",
      "to": "2026-05-06T00:00:00.000Z",
      "amenities": ["AC Bus", "Breakfast", "Guide"],
      "inclusion": ["Hotel Stay", "Sightseeing", "Meals"],
      "exclusion": ["Personal Expenses", "Tips"],
      "termsAndConditions": { "cancellation": "Full refund before 7 days", "booking": "50% advance" },
      "dayWise": [
        { "day": 1, "description": "Arrival in Jaipur, Hawa Mahal..." },
        { "day": 2, "description": "Amber Fort, Shopping..." }
      ],
      "starRating": 4,
      "images": ["https://s3.../tour1.jpg"],
      "vehicles": [
        {
          "_id": "v001",
          "name": "AC Bus",
          "vehicleNumber": "RJ14AB1234",
          "totalSeats": 40,
          "seaterType": "2x2",
          "seatConfig": { "rows": 10, "left": 2, "right": 2, "aisle": true },
          "seatLayout": ["1A","1B","1C","1D","2A","2B",...],
          "bookedSeats": ["1A","1B"],
          "pricePerSeat": 500,
          "isActive": true
        }
      ],
      "tourStartDate": "2026-05-01T00:00:00.000Z",
      "tourEndDate": "2026-05-06T00:00:00.000Z",
      "route": "Jaipur->Udaipur->Jodhpur",
      "isCustomizable": false,
      "runningStatus": "upcoming"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### `runningStatus` Values
- `upcoming` — tour start date future me hai
- `ongoing` — tour abhi chal raha hai
- `completed` — tour khatam ho chuka hai

### Flow
1. User Tours tab kholega
2. All accepted tours paginated list me aayenge
3. Sort and paginate as needed

### 📱 UI Spec
- **Screen:** Tours Listing Screen
- Tour card: Image carousel, Agency name, Route (Jaipur→Udaipur→Jodhpur)
- Duration badge: "5N 6D"
- Price: "₹15,000/person"
- Status badge: Upcoming (blue) / Ongoing (green) / Completed (gray)
- Themes chips
- "Book Now" CTA

---

## 5.2 GET `/filter-tour/by-query`

**Purpose:** Tours search & filter  
**Auth Required:** Yes

### Query Parameters

| Key              | Type    | Required | Description                          |
|------------------|---------|----------|--------------------------------------|
| `q`              | String  | No       | Free text search                     |
| `country`        | String  | No       | Country filter                       |
| `state`          | String  | No       | State filter                         |
| `city`           | String  | No       | City filter                          |
| `from`           | String  | No       | Departure city                       |
| `themes`         | String  | No       | Theme filter (Heritage, Adventure)   |
| `amenities`      | String  | No       | Amenities filter                     |
| `visitingPlace`  | String  | No       | Visiting place name                  |
| `minPrice`       | Number  | No       | Minimum price                        |
| `maxPrice`       | Number  | No       | Maximum price                        |
| `minNights`      | Number  | No       | Minimum nights                       |
| `maxNights`      | Number  | No       | Maximum nights                       |
| `minRating`      | Number  | No       | Minimum star rating                  |
| `fromDate`       | String  | No       | Tours starting after this date       |
| `toDate`         | String  | No       | Tours starting before this date      |
| `isCustomizable` | Boolean | No       | Customizable tours only              |
| `runningStatus`  | String  | No       | `upcoming`, `ongoing`, `completed`   |
| `sortBy`         | String  | No       | `createdAt`, `price`, `starRating`, `nights`, `tourStartDate` |
| `sortOrder`      | String  | No       | `asc` / `desc`                       |
| `page`           | Number  | No       | Page number (default: 1)             |
| `limit`          | Number  | No       | Per page (default: 10, max: 50)      |

### Response `200`
Same structure as `/get-all-tours` with additional `applied` object showing which filters were used.

### Flow
1. User filter form fill karta hai
2. Server intelligent matching karta hai — city fallback, loose route matching
3. Smart search: agar keyword city me match nahi hua toh visitingPlaces me dhundhega

### 📱 UI Spec
- **Screen:** Tour Search Screen
- **Search bar** at top
- **Filter Sheet:**
  - Destination / City
  - Date range picker
  - Price range slider
  - Duration (nights) range
  - Themes multi-select (Heritage, Beach, Mountain, etc.)
  - Status: Upcoming / Ongoing / All
- Results: Tour cards (same as listing)

---

## 5.3 GET `/get-tour/:id`

**Purpose:** Single tour ki complete details  
**Auth Required:** Yes

### Path Params

| Param | Type   | Required | Description         |
|-------|--------|----------|---------------------|
| `id`  | String | Yes      | Tour's MongoDB `_id`|

### Response `200`

```json
{
  "success": true,
  "data": {
    "_id": "665e...",
    "travelAgencyName": "Indian Adventures",
    "agencyPhone": "9876543210",
    "agencyEmail": "info@indianadv.com",
    "country": "India",
    "state": "Rajasthan",
    "city": "Jaipur",
    "visitngPlaces": "2N Jaipur | 1N Udaipur | 2N Jodhpur",
    "themes": "Heritage,Adventure",
    "price": 15000,
    "nights": 5,
    "days": 6,
    "from": "2026-05-01",
    "to": "2026-05-06",
    "amenities": ["AC Bus", "Breakfast", "Guide"],
    "inclusion": ["Hotel Stay", "Sightseeing", "Meals"],
    "exclusion": ["Personal Expenses", "Tips"],
    "termsAndConditions": { "cancellation": "...", "booking": "..." },
    "dayWise": [
      { "day": 1, "description": "..." },
      { "day": 2, "description": "..." }
    ],
    "starRating": 4,
    "images": ["..."],
    "vehicles": [
      {
        "_id": "v001",
        "name": "AC Bus",
        "totalSeats": 40,
        "seatConfig": { "rows": 10, "left": 2, "right": 2, "aisle": true },
        "bookedSeats": ["1A", "1B"],
        "pricePerSeat": 500
      }
    ],
    "isCustomizable": false,
    "route": "Jaipur->Udaipur->Jodhpur",
    "runningStatus": "upcoming"
  }
}
```

### Flow
1. User tour card tap karta hai
2. Full tour document return hota hai with computed `runningStatus`

### 📱 UI Spec
- **Screen:** Tour Detail Screen
- **Top:** Image carousel
- **Section 1:** Agency name, Route, Duration badge, Price
- **Section 2:** Visiting Places timeline (2N Jaipur → 1N Udaipur → 2N Jodhpur)
- **Section 3:** Day-wise itinerary (expandable)
- **Section 4:** Amenities, Inclusions, Exclusions (icon lists)
- **Section 5:** Vehicle & Seat selection
  - Vehicle tabs (if multiple)
  - Seat layout grid (booked=gray, available=green, selected=blue)
  - Price per seat shown
- **Section 6:** Terms & Conditions (collapsible)
- **Bottom CTA:** "Book Now (₹15,000)" sticky button
- Status: "Upcoming in X days" / "Ongoing" / "Completed"

---

## 5.4 POST `/tour-booking/create-tour-booking`

**Purpose:** Tour booking create karna  
**Auth Required:** Yes  
**Content-Type:** `application/json`

### Request Body

| Key                | Type     | Required | Description                        |
|--------------------|----------|----------|------------------------------------|
| `userId`           | String   | Yes      | User ID                            |
| `tourId`           | String   | Yes      | Tour's `_id`                       |
| `vehicleId`        | String   | Yes      | Vehicle's `_id`                    |
| `seats`            | String[] | Yes      | Selected seat codes: `["3A","3B"]` |
| `numberOfAdults`   | Number   | Yes      | Adults count                       |
| `numberOfChildren` | Number   | No       | Children count (default: 0)        |
| `passengers`       | Array    | No       | `[{type:"adult",fullName:"...",gender:"male",dateOfBirth:"..."}]` |
| `from`             | String   | No       | Override departure date            |
| `to`               | String   | No       | Override return date               |
| `tourStartDate`    | String   | No       | Override start date                |
| `payment`          | Object   | No       | `{mode:"online"}` or `{mode:"offline",isPaid:true,collectedBy:"admin"}` |
| `tax`              | Number   | No       | Tax amount (default: 0)            |
| `discount`         | Number   | No       | Discount (default: 0)              |
| `bookingSource`    | String   | No       | `"app"` / `"panel"`               |

### Response `201`

```json
{
  "success": true,
  "message": "Tour booking created. Complete online payment to confirm.",
  "data": {
    "_id": "665f...",
    "bookingCode": "A1B2C3D4E5",
    "userId": "45678901",
    "tourId": "665e...",
    "vehicleId": "v001",
    "seats": ["3A", "3B"],
    "status": "pending",
    "numberOfAdults": 2,
    "numberOfChildren": 0,
    "passengers": [
      { "type": "adult", "fullName": "Rahul Kumar", "gender": "male" },
      { "type": "adult", "fullName": "Priya Kumar", "gender": "female" }
    ],
    "travelAgencyName": "Indian Adventures",
    "agencyPhone": "9876543210",
    "agencyEmail": "info@indianadv.com",
    "visitngPlaces": "2N Jaipur | 1N Udaipur | 2N Jodhpur",
    "country": "India",
    "state": "Rajasthan",
    "city": "Jaipur",
    "themes": "Heritage,Adventure",
    "nights": 5,
    "days": 6,
    "from": "2026-05-01",
    "to": "2026-05-06",
    "tourStartDate": "2026-05-01",
    "amenities": ["AC Bus", "Breakfast", "Guide"],
    "inclusion": ["Hotel Stay", "Sightseeing"],
    "exclusion": ["Personal Expenses"],
    "termsAndConditions": { "cancellation": "..." },
    "dayWise": [{ "day": 1, "description": "..." }],
    "basePrice": 15000,
    "seatPrice": 1000,
    "tax": 0,
    "discount": 0,
    "totalAmount": 16000,
    "payment": {
      "provider": "",
      "mode": "online",
      "orderId": "",
      "isPaid": false,
      "paidAt": null
    },
    "createdAt": "2026-04-01T11:00:00.000Z"
  }
}
```

### Booking Status Values
- `pending` — payment awaiting
- `held` — temporarily held
- `confirmed` — payment done
- `cancelled` — cancelled
- `failed` — payment failed

### Flow
1. User seats select karta hai, passenger details bharta hai
2. API call → Server validates seats conflict check
3. Seats lock ho jaati hain (atomically)
4. Tour snapshot save hota hai booking me
5. **Online:** Status = `pending` → Proceed to PhonePe payment via `/payment/create-order/tour/:id`
6. **Offline (panel):** Status = `confirmed` directly if `payment.isPaid: true`
7. Notification user ko jaata hai

### 📱 UI Spec
- **Screen:** Tour Booking Screen
- **Step 1:** Select seats from seat layout
- **Step 2:** Add passenger details (Adults & Children)
  - Each passenger: Name, Gender, DOB
- **Step 3:** Review booking:
  - Tour name, Route, Dates
  - Seats: 3A, 3B
  - Base Price: ₹15,000
  - Seat Price: ₹1,000
  - Tax: ₹0
  - Discount: -₹0
  - **Total: ₹16,000**
- **Step 4:** Payment (Online)
- "Confirm Booking" → Success → Navigate to payment

---

## 5.5 GET `/tour-booking/get-users-booking`

**Purpose:** User ki tour bookings list  
**Auth Required:** Yes

### Query Parameters

| Key      | Type   | Required | Description |
|----------|--------|----------|-------------|
| `userId` | String | Yes      | User ID     |

### Response `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "665f...",
      "bookingCode": "A1B2C3D4E5",
      "userId": "45678901",
      "tourId": "665e...",
      "status": "confirmed",
      "seats": ["3A", "3B"],
      "numberOfAdults": 2,
      "numberOfChildren": 0,
      "travelAgencyName": "Indian Adventures",
      "visitngPlaces": "2N Jaipur | 1N Udaipur | 2N Jodhpur",
      "from": "2026-05-01",
      "to": "2026-05-06",
      "totalAmount": 16000,
      "payment": { "mode": "online", "isPaid": true, "paidAt": "2026-04-01" },
      "createdAt": "2026-04-01T11:00:00.000Z"
    }
  ]
}
```

### 📱 UI Spec
- **Screen:** My Bookings Screen (Tab: Tours)
- Tour booking card:
  - Tour name / Route, Dates, Seat numbers
  - Status badge, Total amount
  - "View Details" button
- Empty state: "No tour bookings yet" with illustration

---

# 6️⃣ CAB / TRAVEL APIs

---

## 6.1 GET `/travel/get-all-car`

**Purpose:** Sab available cars list  
**Auth Required:** Yes

### Response `200`

```json
[
  {
    "_id": "666a...",
    "make": "Toyota",
    "model": "Innova Crysta",
    "vehicleNumber": "RJ14AB5678",
    "vehicleType": "Car",
    "sharingType": "Private",
    "images": ["https://s3.../car1.jpg"],
    "year": 2024,
    "pickupP": "Jaipur Airport",
    "dropP": "Udaipur Hotel",
    "seater": 7,
    "runningStatus": "Available",
    "seatConfig": [
      { "_id": "s001", "seatType": "Regular", "seatNumber": 1, "seatPrice": 500, "isBooked": false, "bookedBy": "" },
      { "_id": "s002", "seatType": "Regular", "seatNumber": 2, "seatPrice": 500, "isBooked": true, "bookedBy": "9876543210" }
    ],
    "extraKm": 10,
    "perPersonCost": 500,
    "pickupD": "2026-04-10T06:00:00.000Z",
    "dropD": "2026-04-10T18:00:00.000Z",
    "price": 3500,
    "color": "White",
    "mileage": 15,
    "fuelType": "Diesel",
    "transmission": "Manual",
    "isAvailable": true,
    "dateAdded": "2026-03-01T00:00:00.000Z"
  }
]
```

### Flow
1. User Cabs tab kholega
2. All cars return hongi with seat availability status

### 📱 UI Spec
- **Screen:** Cabs Listing Screen
- Car card: Image, Make + Model, Vehicle type badge
- Sharing type badge: "Private" / "Shared"
- Route: Pickup → Drop
- Date: Pickup date & time
- Price: ₹3,500 (Private) / ₹500/seat (Shared)
- Seats available indicator
- "Available" / "On A Trip" status
- "Book Now" button

---

## 6.2 GET `/travel/filter-car/by-query`

**Purpose:** Cars filter karna  
**Auth Required:** Yes

### Query Parameters

| Key             | Type   | Required | Description               |
|-----------------|--------|----------|---------------------------|
| `make`          | String | No       | Car make (Toyota)         |
| `model`         | String | No       | Car model (Innova)        |
| `vehicleNumber` | String | No       | Vehicle number            |
| `fuelType`      | String | No       | Petrol/Diesel/Electric/Hybrid |
| `seater`        | Number | No       | Number of seats           |
| `pickupP`       | String | No       | Pickup point (partial match)|
| `dropP`         | String | No       | Drop point (partial match) |
| `pickupD`       | String | No       | Pickup date (ISO format)  |
| `dropD`         | String | No       | Drop date (ISO format)    |

> **Note:** At least one parameter required.

### Response `200`
Same array structure as `get-all-car`.

### Error Responses

| Code | Message                                |
|------|----------------------------------------|
| 400  | `No filter parameters provided`        |
| 400  | `seater must be a number`              |
| 400  | `Invalid pickupD or dropD date format` |
| 404  | `No cars found matching the filters`   |

### 📱 UI Spec
- **Screen:** Cab Search/Filter Screen
- Filters: Pickup city, Drop city, Date, Fuel type, Seater count
- Results update on filter change

---

## 6.3 GET `/travel/get-a-car/:cabId`

**Purpose:** Single car ki details  
**Auth Required:** Yes

### Path Params

| Param   | Type   | Required | Description       |
|---------|--------|----------|-------------------|
| `cabId` | String | Yes      | Car's MongoDB `_id`|

### Response `200`
Single car object (same structure as list item).

### Error Responses

| Code | Message          |
|------|------------------|
| 400  | `Invalid car id` |
| 404  | `Car not found`  |

### 📱 UI Spec
- **Screen:** Car Detail Screen
- Image carousel, Make + Model, Vehicle number
- Route: Pickup → Drop with dates
- **Seat Selection:**
  - For **Shared**: Interactive seat layout grid
    - Available = green, Booked = gray, Selected = blue
    - Price per seat shown
  - For **Private**: Full car booking, total price shown
- Car specs: Fuel, Transmission, Year, Color, Mileage
- Extra km charge note
- "Book Now" CTA

---

## 6.4 POST `/travel/create-travel/booking`

**Purpose:** Cab/Travel booking create karna  
**Auth Required:** Yes  
**Content-Type:** `application/json`

### Request Body

| Key                  | Type     | Required | Description                       |
|----------------------|----------|----------|-----------------------------------|
| `userId`             | String   | Yes      | User ID                           |
| `carId`              | String   | Yes      | Car's MongoDB `_id`               |
| `customerMobile`     | String   | Yes      | Customer mobile                   |
| `customerEmail`      | String   | Yes      | Customer email                    |
| `seats`              | String[] | No*      | Seat `_id` list for Shared booking|
| `sharingType`        | String   | No       | `"Private"` / `"Shared"`          |
| `vehicleType`        | String   | No       | `"Car"` / `"Bus"` / `"Bike"`     |
| `bookedBy`           | String   | No       | Booker mobile/email               |
| `passengerName`      | String   | No       | Passenger's name                  |
| `paymentMethod`      | String   | No       | `"Online"` / `"Offline"`          |
| `isPaid`             | Boolean  | No       | Only for offline bookings         |
| `confirmOnCreate`    | Boolean  | No       | Auto-confirm (typically false)    |
| `assignedDriverId`   | String   | No       | Driver ID                         |
| `assignedDriverName` | String   | No       | Driver name                       |

> *`seats` required for Shared bookings.  
> For Private: all seats auto-booked.

### Response `201`

```json
{
  "success": true,
  "message": "Booking created successfully. Complete payment via /payment/create-order/travel/:id",
  "data": {
    "_id": "666b...",
    "bookingId": "XY8Z3K1P",
    "carId": "666a...",
    "userId": "45678901",
    "passengerName": "Rahul Kumar",
    "customerMobile": "9876543210",
    "customerEmail": "rahul@example.com",
    "vehicleType": "Car",
    "sharingType": "Private",
    "vehicleNumber": "RJ14AB5678",
    "make": "Toyota",
    "model": "Innova Crysta",
    "color": "White",
    "pickupP": "Jaipur Airport",
    "dropP": "Udaipur Hotel",
    "pickupD": "2026-04-10T06:00:00.000Z",
    "dropD": "2026-04-10T18:00:00.000Z",
    "seats": ["s001", "s002", "s003", "s004", "s005", "s006", "s007"],
    "totalSeatsBooked": 7,
    "basePrice": 3500,
    "gstRate": 5,
    "gstAmount": 175,
    "price": 3675,
    "paymentMode": "online",
    "isPaid": false,
    "bookingStatus": "Pending",
    "rideStatus": "AwaitingConfirmation",
    "pickupCode": "345921",
    "dropCode": "671283",
    "createdAt": "2026-04-01T12:00:00.000Z"
  }
}
```

### Booking Status Flow
```
Pending → Confirmed → Completed
              ↓          ↓
           Cancelled   Failed
```

### Ride Status Flow
```
AwaitingConfirmation → AwaitingPickup → InProgress → Completed
          ↓                  ↓             ↓
        Cancelled          Cancelled      Failed
```

### Flow
1. User seats select karke booking create karta hai
2. Server seat availability atomically check karega
3. GST auto-calculate hoga
4. Seats lock ho jaayengi
5. Pickup code + Drop code generate honge
6. **Online:** Status `Pending` → PhonePe payment via `/payment/create-order/travel/:id`
7. **Offline:** Can be confirmed immediately
8. Email + Notification jaata hai

### 📱 UI Spec
- **Screen:** Cab Booking Screen
- **Step 1:** Confirm car + seats
- **Step 2:** Passenger details (Name, Mobile, Email)
- **Step 3:** Price breakdown:
  - Base Price: ₹3,500
  - GST @5%: ₹175
  - **Total: ₹3,675**
- **Step 4:** Payment method
- "Confirm Booking" → Payment flow
- On success: Show booking ID + Pickup code (important!)

---

## 6.5 GET `/travel/get-bookings-by/user/:userId`

**Purpose:** User ki travel bookings list  
**Auth Required:** Yes

### Path Params

| Param    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `userId` | String | Yes      | User ID     |

### Response `200`

```json
[
  {
    "_id": "666b...",
    "bookingId": "XY8Z3K1P",
    "carId": "666a...",
    "userId": "45678901",
    "passengerName": "Rahul Kumar",
    "customerMobile": "9876543210",
    "vehicleType": "Car",
    "sharingType": "Private",
    "vehicleNumber": "RJ14AB5678",
    "make": "Toyota",
    "model": "Innova Crysta",
    "pickupP": "Jaipur Airport",
    "dropP": "Udaipur Hotel",
    "pickupD": "2026-04-10T06:00:00.000Z",
    "dropD": "2026-04-10T18:00:00.000Z",
    "price": 3675,
    "bookingStatus": "Confirmed",
    "rideStatus": "AwaitingPickup",
    "isPaid": true,
    "pickupCode": "345921",
    "dropCode": "671283",
    "assignedDriverName": "Rajesh",
    "createdAt": "2026-04-01T12:00:00.000Z"
  }
]
```

### 📱 UI Spec
- **Screen:** My Bookings Screen (Tab: Cabs)
- Booking card:
  - Car: Make + Model, Number
  - Route: Pickup → Drop
  - DateTime: Pickup date & time
  - Price, Booking Status, Ride Status
  - Pickup Code (show only if Confirmed/AwaitingPickup)
  - Driver info if assigned
- Status badges (color-coded)
- "Track Ride" button if InProgress

---

# 7️⃣ COUPON APIs

---

## 7.1 POST `/coupons/coupon/user-default`

**Purpose:** User ke assigned coupons lena  
**Auth Required:** Yes  
**Content-Type:** `application/json`  
**Actual Route:** `/coupons/coupon/user-default`

### Request Body

| Key     | Type   | Required | Description          |
|---------|--------|----------|----------------------|
| `email` | String | Yes      | User ki email address|

### Response `200`

```json
[
  {
    "_id": "666c...",
    "couponCode": "456789",
    "type": "user",
    "couponName": "Welcome50",
    "discountPrice": 50,
    "validity": "2026-04-08T00:00:00.000Z",
    "expired": false,
    "quantity": 1,
    "maxUsage": 1,
    "usedCount": 0,
    "assignedTo": "rahul@example.com",
    "targetUserId": "45678901",
    "userId": "45678901",
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
]
```

### Error Responses

| Code | Message              |
|------|----------------------|
| 404  | `No coupon found`    |
| 500  | `Internal server error` |

### Flow
1. User "My Coupons" section kholega
2. API call with user email
3. Valid, non-expired coupons return honge

### 📱 UI Spec
- **Screen:** Coupons Screen / Coupon Section in Booking
- Coupon card:
  - Code: `456789` with copy button
  - Name: "Welcome50"
  - Discount: "₹50 OFF"
  - Validity: "Valid till 08 Apr 2026"
  - Usage: "0/1 used"
- "Apply" button (in booking flow)
- Expired coupons: Strikethrough with "Expired" badge

---

## 7.2 PATCH `/coupons/coupon/apply`

**Purpose:** Coupon apply karna (validate + apply discount on rooms)  
**Auth Required:** Yes  
**Content-Type:** `application/json`  
**Actual Route:** `/coupons/coupon/apply`

### Request Body

| Key          | Type     | Required | Description                      |
|--------------|----------|----------|----------------------------------|
| `couponCode` | String   | Yes      | 6-digit coupon code              |
| `hotelIds`   | String[] | No*      | Hotel IDs (for partner coupons)  |
| `roomIds`    | String[] | No       | Specific rooms (for partner)     |
| `userIds`    | String[] | No       | Applicable user IDs              |

> *For user coupons, just `couponCode` is enough. For partner coupons, `hotelIds` required.

### Response `200` (Partner Coupon)

```json
{
  "message": "Partner coupon applied successfully - ready for booking",
  "data": [
    {
      "hotelId": "12345678",
      "roomId": "abc12345",
      "originalPrice": 3000,
      "discountPrice": 500,
      "finalPrice": 2500
    }
  ],
  "couponCode": "456789",
  "eligibleRooms": 1,
  "usage": {
    "usedCount": 0,
    "maxUsage": 5,
    "remainingQuota": 5
  }
}
```

### Response `200` (User Coupon)

```json
{
  "message": "User coupon is valid",
  "coupon": {
    "couponCode": "456789",
    "couponName": "Welcome50",
    "discountPrice": 50,
    "validity": "2026-04-08T00:00:00.000Z"
  }
}
```

### Error Responses

| Code | Message                   |
|------|---------------------------|
| 400  | `Coupon code required`    |
| 400  | `Coupon expired`          |
| 400  | `Coupon limit reached`    |
| 400  | `No eligible rooms found` |
| 404  | `Coupon code not found`   |

### Flow
1. Booking flow me user coupon code enter karta hai
2. API hit hota hai
3. Partner coupon: Rooms pe discount apply hota hai database me (offer set)
4. User coupon: Validation hoti hai, discount booking time pe minus hota hai
5. Actual usage count booking pe register hota hai, apply pe nahi

### 📱 UI Spec
- **In Booking Flow:**
  - Coupon input field with "Apply" button
  - On success: Green checkmark, "₹50 discount applied!"
  - Price breakdown update ho jaayega
  - On error: Red error text below input

---

# 8️⃣ COMPLAINT APIs

---

## 8.1 POST `/create-a-complaint/on/hotel`

**Purpose:** Hotel ke against complaint create karna  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

### Request Body

| Key          | Type     | Required | Description                                |
|--------------|----------|----------|--------------------------------------------|
| `userId`     | ObjectId | Yes      | User's MongoDB `_id`                       |
| `hotelId`    | ObjectId | Yes      | Hotel's MongoDB `_id`                      |
| `regarding`  | String   | Yes      | Category: `Booking`, `Hotel`, `Website`, `Service`, `Staff`, `Cleanliness`, `Food`, `Billing`, `Room`, `Other` |
| `issue`      | String   | Yes      | Complaint description                      |
| `hotelName`  | String   | No       | Hotel name                                 |
| `hotelEmail` | String   | No       | Hotel email                                |
| `bookingId`  | String   | No       | Related booking ID                         |
| `status`     | String   | No       | Default: `Pending`                         |
| `images`     | File[]   | No       | Evidence images (multipart)                |

### Response `201`

```json
{
  "_id": "666d...",
  "userId": "665a...",
  "hotelId": "665b...",
  "complaintId": "87654321",
  "regarding": "Room",
  "hotelName": "Grand Palace Hotel",
  "hotelEmail": "hotel@example.com",
  "bookingId": "A1B2C3D4E5",
  "images": ["https://s3.../complaint1.jpg"],
  "status": "Pending",
  "issue": "AC not working in the room since check-in",
  "updatedBy": [],
  "createdAt": "2026-04-01T14:00:00.000Z",
  "updatedAt": "2026-04-01T14:00:00.000Z"
}
```

### Complaint Status Values
- `Pending` — new complaint
- `Approved` — accepted by admin
- `Rejected` — rejected
- `Working` — being solved
- `Resolved` — solved

### Error Responses

| Code | Message                                                           |
|------|-------------------------------------------------------------------|
| 400  | `Missing required fields.`                                        |
| 400  | `You have too many pending complaints. Please resolve them...`    |
| 500  | `An error occurred while creating the complaint.`                 |

> Max 3 pending complaints allowed per user.

### Flow
1. User complaint form bharta hai
2. Category select karta hai
3. Issue describe karta hai + optional images
4. Server complaint create karta hai + notification jaata hai
5. Max 3 pending complaints limit

### 📱 UI Spec
- **Screen:** Create Complaint Screen
- Dropdown: Regarding (Booking/Hotel/Room/Staff/etc.)
- Hotel auto-populate if coming from booking
- Text area: Issue description
- Image upload: Multiple photos
- "Submit Complaint" button
- Success: "Complaint #87654321 created" → Navigate to complaints list

---

## 8.2 GET `/complaints/:userId`

**Purpose:** User ki sab complaints + chat messages  
**Auth Required:** Yes

### Path Params

| Param    | Type   | Required | Description          |
|----------|--------|----------|----------------------|
| `userId` | String | Yes      | User ID (string form of ObjectId or userId) |

### Response `200`

```json
[
  {
    "_id": "666d...",
    "userId": "665a...",
    "hotelId": "665b...",
    "complaintId": "87654321",
    "regarding": "Room",
    "hotelName": "Grand Palace Hotel",
    "bookingId": "A1B2C3D4E5",
    "images": ["https://s3.../complaint1.jpg"],
    "status": "Working",
    "issue": "AC not working...",
    "updatedBy": [
      {
        "name": "Admin",
        "email": "admin@hrs.com",
        "status": "Working",
        "feedBack": "Technician assigned",
        "updatedAt": "2026-04-02T10:00:00.000Z"
      }
    ],
    "createdAt": "2026-04-01T14:00:00.000Z",
    "chats": [
      {
        "_id": "666e...",
        "complaintId": "87654321",
        "sender": "45678901",
        "receiver": "admin",
        "content": "When will this be fixed?",
        "timestamp": "2026-04-02T11:00:00.000Z"
      }
    ]
  }
]
```

### Error Responses

| Code | Message                              |
|------|--------------------------------------|
| 404  | `No complaints found for this user.` |

### 📱 UI Spec
- **Screen:** My Complaints Screen
- Complaint card:
  - Complaint ID, Hotel name
  - Category badge, Status badge (color-coded)
  - Issue text (truncated)
  - Created date
  - Images thumbnail strip
  - Tap → Complaint Detail + Chat screen
- Empty state: "No complaints" illustration

---

## 8.3 POST `/do/chat-support/:complaintId`

**Purpose:** Complaint pe chat message bhejma  
**Auth Required:** Yes  
**Content-Type:** `application/json`

### Path Params

| Param          | Type   | Required | Description         |
|----------------|--------|----------|---------------------|
| `complaintId`  | String | Yes      | 8-digit complaint ID|

### Request Body

| Key        | Type   | Required | Description                    |
|------------|--------|----------|--------------------------------|
| `sender`   | String | Yes      | Sender's userId / identifier   |
| `receiver` | String | Yes      | Receiver's identifier          |
| `content`  | String | Yes      | Message text                   |

### Response `201`

```json
{
  "_id": "666e...",
  "complaintId": "87654321",
  "sender": "45678901",
  "receiver": "admin",
  "content": "When will this be fixed?",
  "timestamp": "2026-04-02T11:00:00.000Z"
}
```

### Error Responses

| Code | Message                                     |
|------|---------------------------------------------|
| 400  | `Missing required fields for chat.`         |
| 500  | `Server error while creating chat message.` |

### Flow
1. Complaint detail screen me chat section hota hai
2. User message type karke send karta hai
3. Real-time feel ke liye poll karna ya WebSocket use karna

### 📱 UI Spec
- **Screen:** Complaint Chat Screen
- Chat bubble UI (like WhatsApp)
  - User messages: Right side (blue)
  - Admin messages: Left side (gray)
- Message input field at bottom with Send button
- Auto-scroll to latest message
- Timestamp on each message
- Complaint status banner at top

---

# 9️⃣ NOTIFICATION APIs

---

## 9.1 POST `/app/notifications/register-device`

> **Note:** This endpoint is referenced in the API list but no specific implementation found in routes. Device registration for push notifications may be handled via Firebase/FCM on the client side.

### Expected Request Body

| Key           | Type   | Required | Description             |
|---------------|--------|----------|-------------------------|
| `userId`      | String | Yes      | User ID                 |
| `deviceToken` | String | Yes      | FCM/APNs device token   |
| `platform`    | String | No       | `"android"` / `"ios"`   |

### 📱 UI Spec
- Handled automatically on app launch after login
- Request notification permission
- Register FCM token to backend

---

## 9.2 GET `/app/notifications/user/:userId`

**Purpose:** User ki sab notifications lena  
**Auth Required:** Yes

### Path Params

| Param    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `userId` | String | Yes      | User ID     |

### Response `200`

```json
[
  {
    "_id": "666f...",
    "name": "Hotel Booking Successful",
    "message": "Your hotel booking A1B2C3D4E5 is created successfully for Grand Palace Hotel.",
    "path": "/app/bookings/hotel",
    "eventType": "hotel_booking_success",
    "metadata": {
      "bookingId": "A1B2C3D4E5",
      "hotelId": "12345678",
      "bookingStatus": "Confirmed"
    },
    "userIds": ["45678901"],
    "seenBy": { "45678901": false },
    "seen": false,
    "createdAt": "2026-04-01T10:30:00.000Z",
    "updatedAt": "2026-04-01T10:30:00.000Z"
  },
  {
    "_id": "666g...",
    "name": "Coupon Received",
    "message": "Welcome! You received coupon 456789 worth Rs 50. Valid till 08 Apr 2026.",
    "path": "/app/coupons",
    "eventType": "coupon_assigned",
    "metadata": {
      "couponCode": "456789",
      "discountPrice": 50,
      "validity": "2026-04-08T00:00:00.000Z"
    },
    "seen": false,
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
]
```

### Notification Event Types
| eventType                    | Description                    |
|------------------------------|--------------------------------|
| `hotel_booking_success`      | Hotel booking created          |
| `hotel_booking_pending`      | Payment pending                |
| `hotel_booking_confirmed`    | Booking confirmed              |
| `tour_booking_confirmed`     | Tour booking confirmed         |
| `tour_booking_pending`       | Tour booking payment pending   |
| `travel_booking_confirmed`   | Cab booking confirmed          |
| `travel_booking_pending`     | Cab booking pending            |
| `travel_booking_cancelled`   | Cab booking cancelled          |
| `travel_ride_started`        | Ride started                   |
| `travel_ride_completed`      | Ride completed                 |
| `coupon_assigned`            | New coupon received            |
| `complaint_created`          | Complaint submitted            |
| `complaint_status_changed`   | Complaint status update        |
| `password_changed`           | Password changed               |

### Flow
1. User notifications bell tap karta hai
2. All notifications sorted by latest first
3. `seen: false` wale unread hain

### 📱 UI Spec
- **Screen:** Notifications Screen
- Bell icon on Home screen with unread count badge
- Notification item:
  - Icon based on eventType (booking=hotel icon, coupon=gift icon, etc.)
  - Title (name), Message, Timestamp (relative: "2 hours ago")
  - Unread: Bold / Blue dot indicator
  - Tap → Navigate to `path` (e.g., /app/bookings/hotel)
- Pull-to-refresh
- "Mark all as read" option

---

## 9.3 PATCH `/app/notifications/:notificationId/seen/:userId`

**Purpose:** Notification ko "seen/read" mark karna  
**Auth Required:** Yes

### Path Params

| Param            | Type   | Required | Description          |
|------------------|--------|----------|----------------------|
| `notificationId` | String | Yes      | Notification `_id`   |
| `userId`         | String | Yes      | User ID              |

### Request Body

| Key      | Type   | Required | Description      |
|----------|--------|----------|------------------|
| `userId` | String | No       | Alt: pass in body|

### Response `200`

```json
{
  "_id": "666f...",
  "name": "Hotel Booking Successful",
  "message": "...",
  "seenBy": { "45678901": true },
  "userIds": ["45678901"],
  "createdAt": "2026-04-01T10:30:00.000Z"
}
```

### Error Responses

| Code | Message                                  |
|------|------------------------------------------|
| 400  | `userId is required`                     |
| 404  | `Notification not found for this user`   |

### Flow
1. User notification tap karta hai
2. API call se `seenBy` me user marked as `true`
3. UI me unread indicator hat jaata hai

### 📱 UI Spec
- Auto-trigger on notification tap
- OR swipe-to-read gesture
- Unread count badge update instantly

---

## 9.4 DELETE `/find/all/by/list/of/user/for/notification/and-delete/user/:notificationId`

**Purpose:** Notification delete karna  
**Auth Required:** Yes

### Path Params

| Param            | Type   | Required | Description        |
|------------------|--------|----------|---------------------|
| `notificationId` | String | Yes      | Notification `_id`  |

### Response `200`

```json
{
  "message": "deleted"
}
```

### 📱 UI Spec
- Swipe-to-delete gesture on notification item
- Confirmation dialog: "Delete this notification?"
- "Clear All" button at top (optional)

---

# 🔟 ADDITIONAL / MISC APIs

---

## 10.1 GET `/additional/get-bed`

**Purpose:** Available bed types list  
**Auth Required:** Yes

### Response `200`

```json
[
  {
    "_id": "667a...",
    "name": "King Size",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "_id": "667b...",
    "name": "Queen Size"
  },
  {
    "_id": "667c...",
    "name": "Single"
  },
  {
    "_id": "667d...",
    "name": "Double"
  }
]
```

### 📱 UI Spec
- Used in search filters — bed type dropdown/chips
- Auto-capitalized names

---

## 10.2 GET `/additional/get-room`

**Purpose:** Available room types list  
**Auth Required:** Yes

### Response `200`

```json
[
  {
    "_id": "667e...",
    "name": "Deluxe"
  },
  {
    "_id": "667f...",
    "name": "Super Deluxe"
  },
  {
    "_id": "667g...",
    "name": "Suite"
  },
  {
    "_id": "667h...",
    "name": "Standard"
  }
]
```

### 📱 UI Spec
- Used in search filters — room type dropdown/chips

---

## 10.3 GET `/get-all/travel/location`

**Purpose:** Travel header locations (cities with images)  
**Auth Required:** Yes

### Response `200`

```json
[
  {
    "_id": "667i...",
    "location": "Jaipur",
    "images": ["https://s3.../jaipur.jpg"]
  },
  {
    "_id": "667j...",
    "location": "Goa",
    "images": ["https://s3.../goa.jpg"]
  },
  {
    "_id": "667k...",
    "location": "Manali",
    "images": ["https://s3.../manali.jpg"]
  }
]
```

### 📱 UI Spec
- **Home screen:** Popular Destinations section
- Circular/card images with city name overlay
- Tap → Search hotels/tours in that city

---

## 10.4 GET `/health`

**Purpose:** Server health check  
**Auth Required:** No

### Response `200`

```json
{
  "status": "ok",
  "message": "Server is running",
  "pid": 12345,
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

### 📱 UI Spec
- Call on app startup to check connectivity
- If fails: Show "Server unavailable" banner
- Retry mechanism with exponential backoff

---

# 📐 MOBILE APP — OVERALL UI ARCHITECTURE

## Tab Bar Structure
```
┌─────────────────────────────────────────────┐
│  🏠 Home  │  🔍 Search  │  🎫 Bookings  │  👤 Profile  │
└─────────────────────────────────────────────┘
```

## Screen Flow

### 🏠 Home Tab
```
Home Screen
├── Popular Destinations (GET /get-all/travel/location)
├── Featured Hotels (GET /get/offers/main/hotels)
├── Deals & Offers (GET /hotels/with-active-offers)
├── Tour Packages (GET /get-all-tours?limit=5)
└── Cab Services (GET /travel/get-all-car?limit=5)
```

### 🔍 Search Tab
```
Search Screen
├── Hotels Search (GET /hotels/filters)
│   ├── Hotel Detail (GET /hotels/get-by-id/:id)
│   │   └── Book Hotel (POST /booking/:userId/:hotelId)
│   └── Filters (GET /additional/get-bed, GET /additional/get-room)
├── Tours Search (GET /filter-tour/by-query)
│   ├── Tour Detail (GET /get-tour/:id)
│   │   └── Book Tour (POST /tour-booking/create-tour-booking)
│   └── Filters
└── Cabs Search (GET /travel/filter-car/by-query)
    ├── Car Detail (GET /travel/get-a-car/:id)
    │   └── Book Cab (POST /travel/create-travel/booking)
    └── Filters
```

### 🎫 Bookings Tab
```
My Bookings Screen
├── Hotels Tab (GET /get/all/users-filtered/booking/by)
├── Tours Tab (GET /tour-booking/get-users-booking)
├── Cabs Tab (GET /travel/get-bookings-by/user/:userId)
└── Each: Status filters + Pagination
```

### 👤 Profile Tab
```
Profile Screen (GET /get/:userId)
├── Edit Profile (PUT /update)
├── My Coupons (POST /coupons/coupon/user-default)
├── My Complaints (GET /complaints/:userId)
│   ├── New Complaint (POST /create-a-complaint/on/hotel)
│   └── Chat (POST /do/chat-support/:complaintId)
├── Notifications (GET /app/notifications/user/:userId)
└── Logout (Clear token + navigate to Login)
```

## Auth Flow
```
App Launch
├── Check stored token
│   ├── Valid → Home Screen
│   └── Invalid/Expired → Login Screen
└── Login Screen
    ├── Email + Password (POST /signIn)
    ├── Google Sign-In (POST /signIn/google)
    ├── Phone OTP (POST /send-otp → POST /verify-otp)
    └── Email OTP (POST /mail/send-otp → POST /mail/verify-otp)
```

## Payment Flow (PhonePe Integration)
```
Booking Created (status: Pending)
    ↓
POST /payment/create-order/{type}/{bookingId}
    ↓
Open PhonePe payment page
    ↓
Payment callback
    ↓
POST /payment/verify (PhonePe webhook)
    ↓
Booking status → Confirmed
    ↓
Notification sent to user
```

---

# 🔑 KEY NOTES FOR MOBILE DEV

1. **Token Storage:** Store `rsToken` in secure/encrypted storage (Keychain/Keystore)
2. **Token Refresh:** On 403 response → Redirect to login
3. **Error Handling:** All APIs return consistent error format: `{message: "..."}` or `{success: false, message: "..."}`
4. **Image URLs:** All images are S3 URLs — use lazy loading + caching (e.g., Glide/SDWebImage)
5. **Pagination:** Most list APIs support `page` + `limit` — implement infinite scroll
6. **Date Format:** Send dates as `YYYY-MM-DD` string, receive as ISO 8601
7. **Price Display:** Always format with Indian locale: `₹ 3,500` (use `Intl.NumberFormat('en-IN')`)
8. **Offline Mode:** Cache last fetched hotel list, bookings, notifications
9. **Deep Links:** Use notification `path` field for navigation on tap
10. **Pull-to-Refresh:** Implement on all list screens
