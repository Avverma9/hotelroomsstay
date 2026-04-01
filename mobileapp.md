# HotelRoomsStay Mobile App API Documentation

## 📱 Mobile App UI/UX Specifications

### 🏠 **Home Screen Layout**
```
┌─────────────────────────────────────┐
│  🏨 HotelRoomsStay    📦 HRS     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search Hotels           │   │
│  │ 📍 Location               │   │
│  │ 👤 Guests (2 Adults)      │   │
│  │ 📅 Check-in/Check-out     │   │
│  └─────────────────────────────┘   │
│                                 │
│  🏨 Featured Hotels             │
│  ┌─────────┐ ┌─────────┐       │
│  │ Hotel 1 │ │ Hotel 2 │       │
│  │ ₹2,500  │ │ ₹1,800  │       │
│  └─────────┘ └─────────┘       │
│                                 │
│  🎯 Popular Tours               │
│  ┌─────────┐ ┌─────────┐       │
│  │ Tour 1  │ │ Tour 2  │       │
│  │ ₹3,500  │ │ ₹2,200  │       │
│  └─────────┘ └─────────┘       │
│                                 │
│  🚗 Available Cabs              │
│  ┌─────────┐ ┌─────────┐       │
│  │ Cab 1   │ │ Cab 2   │       │
│  │ ₹1,200  │ │ ₹800    │       │
│  └─────────┘ └─────────┘       │
│                                 │
│  👁️ See All Hotels              │
│  🎯 See All Tours               │
│  🚗 See All Cabs                │
└─────────────────────────────────────┘
```

### 🧭 **Bottom Navigation**
```
┌─────────────────────────────────────┐
│  🏠 Home   🚗 Cabs   🎯 Tours   │
│           🏨 Hotels   👤 Profile   │
└─────────────────────────────────────┘
```

### 🔍 **Location Auto-Detection**
- **GPS Integration**: Auto-detect user's current location
- **City Auto-Population**: Automatically fill city name based on location
- **Manual Override**: Allow manual location entry
- **Recent Locations**: Show recent search locations

---

# 🚀 API Endpoints

## 🔐 **Authentication APIs**

### **1. User Registration**
```http
POST /Signup
Content-Type: multipart/form-data

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "password123",
  "profileImage": "file.jpg"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "userId": "USR123456",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "profileImage": "https://s3.amazonaws.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **2. Login with Email/Password**
```http
POST /signIn
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "USR123456",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **3. Login with OTP**
```http
POST /send-otp
Content-Type: application/json

Request Body:
{
  "phone": "+919876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "otpSession": "session_123456"
}
```

```http
POST /verify-otp
Content-Type: application/json

Request Body:
{
  "phone": "+919876543210",
  "otp": "123456",
  "otpSession": "session_123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "userId": "USR123456",
    "name": "John Doe",
    "phone": "+919876543210"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **4. Google Sign-In**
```http
POST /signIn/google
Content-Type: application/json

Request Body:
{
  "googleToken": "ya29.a0AfH6SM..."
}

Response:
{
  "success": true,
  "message": "Google login successful",
  "user": {
    "userId": "USR123456",
    "name": "John Doe",
    "email": "john@example.com",
    "profileImage": "https://lh3.googleusercontent.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🏨 **Hotel APIs**

### **1. Get All Hotels**
```http
GET /get/all/hotels
Authorization: Bearer {token}

Response:
{
  "success": true,
  "hotels": [
    {
      "hotelId": "HTL123456",
      "name": "Grand Plaza Hotel",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "123 Marine Drive"
      },
      "rating": 4.5,
      "price": 2500,
      "images": ["https://s3.amazonaws.com/hotel1.jpg"],
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant"]
    }
  ]
}
```

### **2. Filter Hotels**
```http
GET /hotels/filters?city=Mumbai&priceMin=1000&priceMax=5000&rating=4
Authorization: Bearer {token}

Response:
{
  "success": true,
  "hotels": [
    {
      "hotelId": "HTL123456",
      "name": "Grand Plaza Hotel",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "123 Marine Drive"
      },
      "rating": 4.5,
      "price": 2500,
      "images": ["https://s3.amazonaws.com/hotel1.jpg"],
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
      "rooms": [
        {
          "roomId": "RM-101",
          "type": "Deluxe",
          "price": 2500,
          "countRooms": 5,
          "isOffer": false
        }
      ]
    }
  ],
  "filters": {
    "city": "Mumbai",
    "priceMin": 1000,
    "priceMax": 5000,
    "rating": 4
  }
}
```

### **3. Get Hotel by ID**
```http
GET /hotels/get-by-id/{hotelId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "hotel": {
    "hotelId": "HTL123456",
    "name": "Grand Plaza Hotel",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "address": "123 Marine Drive"
    },
    "rating": 4.5,
    "price": 2500,
    "images": ["https://s3.amazonaws.com/hotel1.jpg"],
    "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
    "rooms": [
      {
        "roomId": "RM-101",
        "type": "Deluxe",
        "price": 2500,
        "countRooms": 5,
        "isOffer": false,
        "images": ["https://s3.amazonaws.com/room1.jpg"]
      }
    ],
    "policies": {
      "checkIn": "12:00 PM",
      "checkOut": "11:00 AM",
      "cancellation": "24 hours before check-in"
    }
  }
}
```

### **4. Get Hotels by City**
```http
GET /hotels/destination/get/all?city=Mumbai
Authorization: Bearer {token}

Response:
{
  "success": true,
  "hotels": [
    {
      "hotelId": "HTL123456",
      "name": "Grand Plaza Hotel",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "rating": 4.5,
      "price": 2500,
      "images": ["https://s3.amazonaws.com/hotel1.jpg"]
    }
  ]
}
```

---

## 🎯 **Tour APIs**

### **1. Get All Tours**
```http
GET /tour/get-all-tours
Authorization: Bearer {token}

Response:
{
  "success": true,
  "tours": [
    {
      "tourId": "TOUR123456",
      "name": "Mumbai City Tour",
      "description": "Explore the best of Mumbai",
      "duration": "2 days",
      "price": 3500,
      "rating": 4.8,
      "images": ["https://s3.amazonaws.com/tour1.jpg"],
      "includes": ["Transport", "Guide", "Meals"],
      "locations": ["Gateway of India", "Marine Drive", "Juhu Beach"]
    }
  ]
}
```

### **2. Filter Tours**
```http
GET /tour/filter-tours?city=Mumbai&priceMin=1000&priceMax=5000&duration=2
Authorization: Bearer {token}

Response:
{
  "success": true,
  "tours": [
    {
      "tourId": "TOUR123456",
      "name": "Mumbai City Tour",
      "description": "Explore the best of Mumbai",
      "duration": "2 days",
      "price": 3500,
      "rating": 4.8,
      "images": ["https://s3.amazonaws.com/tour1.jpg"],
      "includes": ["Transport", "Guide", "Meals"],
      "locations": ["Gateway of India", "Marine Drive", "Juhu Beach"],
      "availableSeats": 15,
      "totalSeats": 20
    }
  ]
}
```

### **3. Get Tour by ID**
```http
GET /tour/get-tour/{tourId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "tour": {
    "tourId": "TOUR123456",
    "name": "Mumbai City Tour",
    "description": "Explore the best of Mumbai with our expert guides",
    "duration": "2 days",
    "price": 3500,
    "rating": 4.8,
    "images": ["https://s3.amazonaws.com/tour1.jpg"],
    "includes": ["Transport", "Guide", "Meals", "Entry Fees"],
    "excludes": ["Personal Expenses", "Tips"],
    "locations": ["Gateway of India", "Marine Drive", "Juhu Beach", "Siddhivinayak Temple"],
    "itinerary": [
      {
        "day": 1,
        "activities": ["Pickup from Hotel", "Gateway of India", "Marine Drive", "Juhu Beach"]
      },
      {
        "day": 2,
        "activities": ["Siddhivinayak Temple", "Local Shopping", "Drop to Hotel"]
      }
    ],
    "availableSeats": 15,
    "totalSeats": 20
  }
}
```

---

## 🚗 **Cab APIs**

### **1. Get All Cabs**
```http
GET /travel/get-all-car
Authorization: Bearer {token}

Response:
{
  "success": true,
  "cars": [
    {
      "carId": "CAB123456",
      "name": "Toyota Innova",
      "type": "SUV",
      "capacity": 7,
      "pricePerKm": 15,
      "driverName": "Rajesh Kumar",
      "driverPhone": "+919876543210",
      "rating": 4.6,
      "images": ["https://s3.amazonaws.com/cab1.jpg"],
      "amenities": ["AC", "Music System", "Charging Point"]
    }
  ]
}
```

### **2. Filter Cabs**
```http
GET /travel/filter-car/by-query?type=SUV&capacity=7&city=Mumbai
Authorization: Bearer {token}

Response:
{
  "success": true,
  "cars": [
    {
      "carId": "CAB123456",
      "name": "Toyota Innova",
      "type": "SUV",
      "capacity": 7,
      "pricePerKm": 15,
      "driverName": "Rajesh Kumar",
      "driverPhone": "+919876543210",
      "rating": 4.6,
      "images": ["https://s3.amazonaws.com/cab1.jpg"],
      "amenities": ["AC", "Music System", "Charging Point"],
      "available": true
    }
  ]
}
```

### **3. Get Cab by ID**
```http
GET /travel/get-a-car/{carId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "car": {
    "carId": "CAB123456",
    "name": "Toyota Innova",
    "type": "SUV",
    "capacity": 7,
    "pricePerKm": 15,
    "driverName": "Rajesh Kumar",
    "driverPhone": "+919876543210",
    "driverLicense": "DL1234567890",
    "rating": 4.6,
    "images": ["https://s3.amazonaws.com/cab1.jpg"],
    "amenities": ["AC", "Music System", "Charging Point", "GPS"],
    "available": true,
    "reviews": [
      {
        "user": "John Doe",
        "rating": 5,
        "comment": "Great service, clean car"
      }
    ]
  }
}
```

---

## 🎫 **Coupon APIs**

### **1. Apply Coupon**
```http
PATCH /coupons/coupon/apply
Authorization: Bearer {token}

Request Body:
{
  "couponCode": "843740",
  "hotelId": "48291034",
  "roomId": "RM-101",
  "userId": "23533101"
}

Response:
{
  "success": true,
  "message": "Partner coupon applied successfully - ready for booking",
  "data": [
    {
      "hotelId": "48291034",
      "roomId": "RM-101",
      "originalPrice": 2500,
      "discountPrice": 500,
      "finalPrice": 2000
    }
  ],
  "couponCode": "843740",
  "eligibleRooms": 1,
  "usage": {
    "usedCount": 0,
    "maxUsage": 10,
    "remainingQuota": 10,
    "note": "Usage count will increment only on actual booking"
  }
}
```

### **2. Register Coupon Usage on Booking**
```http
POST /coupons/coupon/register-usage
Authorization: Bearer {token}

Request Body:
{
  "couponCode": "843740",
  "hotelId": "48291034",
  "roomId": "RM-101",
  "userId": "23533101",
  "bookingId": "BK-12345"
}

Response:
{
  "success": true,
  "message": "Coupon usage registered successfully",
  "couponCode": "843740",
  "bookingId": "BK-12345",
  "usage": {
    "usedCount": 1,
    "maxUsage": 10,
    "remainingQuota": 9
  },
  "discountApplied": 500
}
```

### **3. Get User Coupons**
```http
GET /coupons/coupon?type=user
Authorization: Bearer {token}

Response:
{
  "success": true,
  "coupons": [
    {
      "couponCode": "USER123",
      "couponName": "Welcome Discount",
      "discountPrice": 500,
      "validity": "2024-12-31",
      "usedCount": 0,
      "maxUsage": 1,
      "remainingQuota": 1,
      "type": "user"
    }
  ]
}
```

---

## 💰 **GST Calculation APIs**

### **1. Get Current GST**
```http
GET /gst/get-single-gst
Authorization: Bearer {token}

Response:
{
  "success": true,
  "gst": {
    "id": "GST123",
    "percentage": 18,
    "description": "Hotel and Accommodation GST",
    "effectiveFrom": "2024-01-01",
    "status": "active"
  }
}
```

### **2. Calculate GST for Booking**
```http
POST /gst/calculate-gst
Authorization: Bearer {token}

Request Body:
{
  "baseAmount": 2500,
  "serviceType": "hotel",
  "duration": 2
}

Response:
{
  "success": true,
  "calculation": {
    "baseAmount": 2500,
    "gstPercentage": 18,
    "gstAmount": 450,
    "totalAmount": 2950,
    "breakdown": {
      "cgst": 225,
      "sgst": 225
    }
  }
}
```

---

## 📅 **Booking APIs**

### **1. Create Hotel Booking**
```http
POST /booking/{userId}/{hotelId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request Body:
{
  "roomId": "RM-101",
  "checkIn": "2024-12-25",
  "checkOut": "2024-12-27",
  "guests": {
    "adults": 2,
    "children": 1
  },
  "couponCode": "843740",
  "specialRequests": "Early check-in requested"
}

Response:
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "bookingId": "BK-12345",
    "hotelId": "48291034",
    "roomId": "RM-101",
    "userId": "23533101",
    "checkIn": "2024-12-25",
    "checkOut": "2024-12-27",
    "totalAmount": 4000,
    "discountAmount": 500,
    "gstAmount": 630,
    "finalAmount": 4130,
    "status": "confirmed",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

### **2. Get Booking by ID**
```http
GET /booking/{bookingId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "booking": {
    "bookingId": "BK-12345",
    "hotel": {
      "hotelId": "48291034",
      "name": "Grand Plaza Hotel",
      "location": {
        "city": "Mumbai",
        "address": "123 Marine Drive"
      }
    },
    "room": {
      "roomId": "RM-101",
      "type": "Deluxe",
      "price": 2500
    },
    "checkIn": "2024-12-25",
    "checkOut": "2024-12-27",
    "totalAmount": 4000,
    "discountAmount": 500,
    "gstAmount": 630,
    "finalAmount": 4130,
    "status": "confirmed",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

### **3. Get All User Bookings**
```http
GET /booking/get-all-users-filtered-booking-by/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "bookings": [
    {
      "bookingId": "BK-12345",
      "hotel": {
        "hotelId": "48291034",
        "name": "Grand Plaza Hotel",
        "location": {
          "city": "Mumbai",
          "address": "123 Marine Drive"
        }
      },
      "room": {
        "roomId": "RM-101",
        "type": "Deluxe"
      },
      "checkIn": "2024-12-25",
      "checkOut": "2024-12-27",
      "totalAmount": 4000,
      "status": "confirmed",
      "createdAt": "2024-12-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

### **4. Cancel Booking**
```http
POST /booking/{bookingId}/cancel/send-otp
Authorization: Bearer {token}

Request Body:
{
  "reason": "Travel plans changed"
}

Response:
{
  "success": true,
  "message": "OTP sent for booking cancellation",
  "otpSession": "session_789012"
}
```

```http
POST /booking/{bookingId}/cancel/verify
Authorization: Bearer {token}

Request Body:
{
  "otp": "123456",
  "otpSession": "session_789012"
}

Response:
{
  "success": true,
  "message": "Booking cancelled successfully",
  "refundAmount": 4130,
  "refundStatus": "processed"
}
```

---

## 👤 **User Profile APIs**

### **1. Get User Profile**
```http
GET /user/get/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "userId": "USR123456",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "profileImage": "https://s3.amazonaws.com/profile.jpg",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "preferences": {
      "language": "en",
      "currency": "INR",
      "notifications": true
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### **2. Update User Profile**
```http
PUT /user/update
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request Body:
{
  "name": "John Smith",
  "phone": "+919876543211",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "profileImage": "file.jpg"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "userId": "USR123456",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+919876543211",
    "profileImage": "https://s3.amazonaws.com/new-profile.jpg"
  }
}
```

---

## 🎯 **Tour Booking APIs**

### **1. Create Tour Booking**
```http
POST /tour/create-booking
Authorization: Bearer {token}

Request Body:
{
  "tourId": "TOUR123456",
  "userId": "USR123456",
  "travelDate": "2024-12-25",
  "participants": 2,
  "specialRequests": "Vegetarian meals required"
}

Response:
{
  "success": true,
  "message": "Tour booking created successfully",
  "booking": {
    "bookingId": "TB-12345",
    "tourId": "TOUR123456",
    "userId": "USR123456",
    "travelDate": "2024-12-25",
    "participants": 2,
    "totalAmount": 7000,
    "gstAmount": 1260,
    "finalAmount": 8260,
    "status": "confirmed",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

### **2. Get Tour Bookings**
```http
GET /tour/get-bookings/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "bookings": [
    {
      "bookingId": "TB-12345",
      "tour": {
        "tourId": "TOUR123456",
        "name": "Mumbai City Tour",
        "duration": "2 days"
      },
      "travelDate": "2024-12-25",
      "participants": 2,
      "totalAmount": 7000,
      "status": "confirmed",
      "createdAt": "2024-12-20T10:30:00Z"
    }
  ]
}
```

---

## 🚗 **Cab Booking APIs**

### **1. Create Cab Booking**
```http
POST /travel/booking/create-booking
Authorization: Bearer {token}

Request Body:
{
  "carId": "CAB123456",
  "userId": "USR123456",
  "pickupLocation": {
    "address": "123 Main St, Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "dropLocation": {
    "address": "456 Park Ave, Mumbai",
    "latitude": 19.0876,
    "longitude": 72.8888
  },
  "pickupDateTime": "2024-12-25T10:00:00Z",
  "estimatedDistance": 25,
  "estimatedDuration": "1 hour"
}

Response:
{
  "success": true,
  "message": "Cab booking created successfully",
  "booking": {
    "bookingId": "CB-12345",
    "carId": "CAB123456",
    "userId": "USR123456",
    "pickupLocation": {
      "address": "123 Main St, Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "dropLocation": {
      "address": "456 Park Ave, Mumbai",
      "latitude": 19.0876,
      "longitude": 72.8888
    },
    "pickupDateTime": "2024-12-25T10:00:00Z",
    "estimatedDistance": 25,
    "estimatedDuration": "1 hour",
    "totalAmount": 375,
    "gstAmount": 67.5,
    "finalAmount": 442.5,
    "status": "confirmed",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

---

## 🎨 **Mobile App Design Guidelines**

### **Color Scheme**
```css
:root {
  --primary-color: #2C3E50;      /* Dark Blue */
  --secondary-color: #E74C3C;    /* Red */
  --accent-color: #3498DB;       /* Light Blue */
  --success-color: #27AE60;       /* Green */
  --warning-color: #F39C12;       /* Orange */
  --danger-color: #E74C3C;       /* Red */
  --light-bg: #ECF0F1;          /* Light Gray */
  --dark-bg: #34495E;           /* Dark Gray */
  --text-primary: #2C3E50;       /* Dark Blue */
  --text-secondary: #7F8C8D;     /* Gray */
  --white: #FFFFFF;               /* White */
}
```

### **Typography**
```css
.font-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 18px;
}

.font-body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
}

.font-caption {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
}
```

### **Component Specifications**

#### **Search Bar**
```css
.search-container {
  background: var(--white);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 16px;
}

.search-input {
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  width: 100%;
}
```

#### **Card Component**
```css
.hotel-card {
  background: var(--white);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.hotel-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.hotel-name {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0 4px 0;
}

.hotel-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-color);
}
```

#### **Bottom Navigation**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--white);
  border-top: 1px solid #E0E0E0;
  padding: 8px 0;
  display: flex;
  justify-content: space-around;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  min-width: 60px;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 10px;
  color: var(--text-secondary);
}
```

---

## 📱 **Mobile App Features**

### **🔍 Smart Search**
- **Location Auto-Detection**: GPS-based location detection
- **Auto-Complete**: Smart suggestions for hotels, tours, cabs
- **Voice Search**: Voice input support
- **Recent Searches**: Save and display recent searches

### **🎯 Personalization**
- **User Preferences**: Save favorite destinations, dates
- **Recommendations**: AI-powered suggestions
- **Loyalty Points**: Reward system integration
- **Wishlist**: Save favorite hotels/tours

### **💳 Payment Integration**
- **Multiple Payment Options**: Credit Card, Debit Card, UPI, Wallets
- **Secure Payment**: PCI compliant payment gateway
- **EMI Options**: Installment payment support
- **Refund Processing**: Automatic refund on cancellation

### **🔔 Notifications**
- **Push Notifications**: Real-time updates
- **Booking Reminders**: Check-in/out reminders
- **Price Alerts**: Price drop notifications
- **Promotional Offers**: Special deals and discounts

### **🌐 Multi-Language Support**
- **English**: Primary language
- **Hindi**: Regional language support
- **Gujarati**: Local language support
- **Auto-Detect**: Language detection based on device settings

### **📊 Analytics & Insights**
- **Booking History**: Complete booking timeline
- **Savings Tracker**: Track savings from coupons
- **Travel Statistics**: Distance traveled, places visited
- **Expense Tracking**: Travel expense analysis

---

## 🔧 **Technical Implementation**

### **📱 Platform Support**
- **iOS**: iOS 13+ support
- **Android**: Android 8+ support
- **React Native**: Cross-platform development
- **PWA**: Progressive Web App support

### **🔐 Security**
- **JWT Authentication**: Secure token-based auth
- **OAuth 2.0**: Social login integration
- **Data Encryption**: End-to-end encryption
- **API Rate Limiting**: Prevent abuse

### **⚡ Performance**
- **Image Optimization**: WebP format support
- **Lazy Loading**: On-demand content loading
- **Caching**: Local storage for offline access
- **CDN Integration**: Fast content delivery

### **🔄 Offline Support**
- **Offline Bookings**: Queue bookings when offline
- **Cached Data**: Store frequently accessed data
- **Sync Mechanism**: Auto-sync when online
- **Offline Maps**: Download maps for offline use

---

## 🚀 **Deployment & Testing**

### **📦 Build Process**
```bash
# React Native Build
npx react-native build android --mode=release
npx react-native build ios --mode=Release

# PWA Build
npm run build
```

### **🧪 Testing Strategy**
- **Unit Tests**: Jest + React Native Testing Library
- **Integration Tests**: Detox E2E testing
- **Performance Tests**: Flipper profiling
- **Beta Testing**: TestFlight + Google Play Console

### **📈 Analytics Integration**
- **Firebase Analytics**: User behavior tracking
- **Crashlytics**: Crash reporting
- **Performance Monitoring**: App performance metrics
- **Custom Events**: Booking, search, payment events

---

## 📞 **Support & Contact**

### **🆘 Emergency Support**
- **24/7 Helpline**: +91-XXXX-XXXXXX
- **In-App Chat**: Real-time customer support
- **Email Support**: support@hotelroomsstay.com
- **FAQ Section**: Self-help documentation

### **📱 App Store Information**
- **Play Store**: com.hotelroomsstay.mobile
- **App Store**: HotelRoomsStay - Hotel & Tour Booking
- **Version**: 1.0.0
- **Size**: ~45MB
- **Rating**: 4.5+ stars

---

*This documentation covers all essential APIs and features for the HotelRoomsStay mobile application. For any additional requirements or clarifications, please contact the development team.*
