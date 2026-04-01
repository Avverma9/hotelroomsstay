# HotelRoomsStay API Integration Documentation

## 📋 API Classification Overview

### 🎯 **Frontend APIs** (Mobile & Web App)
- **Authentication**: User login, registration, profile management
- **Hotel Search**: Find hotels, filter, get details
- **Booking**: Create, view, cancel bookings
- **Tours**: Browse and book tours
- **Cabs**: Find and book cabs
- **Coupons**: Apply and manage coupons
- **Payments**: Process payments

### 🛠️ **Panel APIs** (Admin Dashboard)
- **Hotel Management**: CRUD operations for hotels
- **Booking Management**: View and manage all bookings
- **User Management**: User data and analytics
- **Coupon Management**: Create and manage coupons
- **Content Management**: Manage website content
- **Reports**: Analytics and reports

---

# 🔐 Authentication APIs

## 1. User Registration
**Type**: Frontend (Mobile & Web)  
**Use Case**: New user account creation

```http
POST /Signup
Content-Type: multipart/form-data
Authorization: None

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

## 2. User Login
**Type**: Frontend (Mobile & Web)  
**Use Case**: User authentication

```http
POST /signIn
Content-Type: application/json
Authorization: None

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

## 3. OTP Login
**Type**: Frontend (Mobile & Web)  
**Use Case**: Phone-based authentication

```http
POST /send-otp
Content-Type: application/json
Authorization: None

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
Authorization: None

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

## 4. Google Sign-In
**Type**: Frontend (Mobile & Web)  
**Use Case**: Social login integration

```http
POST /signIn/google
Content-Type: application/json
Authorization: None

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

# 🏨 Hotel APIs

## 1. Get All Hotels (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Display hotel listings

```http
GET /get/main/get/hotels
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

## 2. Filter Hotels (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Search hotels with filters

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

## 3. Get Hotel by ID (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: View hotel details page

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

## 4. Get All Hotels (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Admin hotel management

```http
GET /get/all/hotels
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "hotels": [
    {
      "hotelId": "HTL123456",
      "name": "Grand Plaza Hotel",
      "status": "active",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "123 Marine Drive"
      },
      "rating": 4.5,
      "price": 2500,
      "images": ["https://s3.amazonaws.com/hotel1.jpg"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## 5. Create Hotel (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Add new hotel

```http
POST /data/hotels-new/post/upload/data
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Request Body:
{
  "name": "Grand Plaza Hotel",
  "description": "Luxury hotel in Mumbai",
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "address": "123 Marine Drive"
  },
  "contact": {
    "phone": "+912212345678",
    "email": "info@grandplaza.com"
  },
  "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
  "images": ["file1.jpg", "file2.jpg"],
  "rooms": [
    {
      "roomId": "RM-101",
      "type": "Deluxe",
      "price": 2500,
      "countRooms": 5,
      "images": ["room1.jpg"]
    }
  ]
}

Response:
{
  "success": true,
  "message": "Hotel created successfully",
  "hotel": {
    "hotelId": "HTL123456",
    "name": "Grand Plaza Hotel",
    "status": "pending"
  }
}
```

## 6. Update Hotel (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Update hotel information

```http
PATCH /hotels/master/{hotelId}
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Request Body:
{
  "name": "Updated Grand Plaza Hotel",
  "description": "Updated description",
  "price": 3000,
  "status": "active"
}

Response:
{
  "success": true,
  "message": "Hotel updated successfully",
  "hotel": {
    "hotelId": "HTL123456",
    "name": "Updated Grand Plaza Hotel",
    "price": 3000,
    "status": "active"
  }
}
```

## 7. Delete Hotel (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Remove hotel from system

```http
DELETE /delete/hotels/by/{hotelId}
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "message": "Hotel deleted successfully"
}
```

---

# 🎫 Coupon APIs

## 1. Apply Coupon (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Apply coupon discount during booking

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

## 2. Register Coupon Usage (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Register coupon usage after booking

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

## 3. Get All Coupons (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: View all coupons

```http
GET /coupons/coupon
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "coupons": [
    {
      "couponId": "C123456",
      "couponCode": "843740",
      "couponName": "Partner Discount",
      "type": "partner",
      "discountPrice": 500,
      "validity": "2024-12-31",
      "usedCount": 5,
      "maxUsage": 10,
      "remainingQuota": 5,
      "status": "active"
    }
  ]
}
```

## 4. Create Coupon (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Create new coupon

```http
POST /coupons/coupon
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
  "type": "partner",
  "couponName": "Special Discount",
  "discountPrice": 500,
  "validity": "2024-12-31",
  "quantity": 10,
  "maxUsage": 10,
  "assignedTo": "partner@example.com"
}

Response:
{
  "success": true,
  "message": "Coupon code created",
  "coupon": {
    "couponId": "C123456",
    "couponCode": "843740",
    "couponName": "Special Discount",
    "type": "partner",
    "discountPrice": 500,
    "validity": "2024-12-31",
    "quantity": 10,
    "maxUsage": 10,
    "status": "active"
  }
}
```

---

# 📅 Booking APIs

## 1. Create Booking (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Create hotel booking

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

## 2. Get Booking by ID (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: View booking details

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

## 3. Get All User Bookings (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: View user's booking history

```http
GET /get/all/users-filtered/booking/by/{userId}
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

## 4. Get All Bookings (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: View all bookings in admin panel

```http
GET /get/all/filtered/booking/by/query
Authorization: Bearer {admin_token}

Query Parameters:
- status: confirmed|cancelled|completed
- dateFrom: 2024-12-01
- dateTo: 2024-12-31
- hotelId: HTL123456

Response:
{
  "success": true,
  "bookings": [
    {
      "bookingId": "BK-12345",
      "user": {
        "userId": "USR123456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "hotel": {
        "hotelId": "HTL123456",
        "name": "Grand Plaza Hotel"
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
    "limit": 20,
    "total": 150
  }
}
```

## 5. Update Booking (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Update booking details

```http
PUT /updatebooking/{bookingId}
Authorization: Bearer {admin_token}

Request Body:
{
  "status": "confirmed",
  "specialRequests": "Updated special requests"
}

Response:
{
  "success": true,
  "message": "Booking updated successfully",
  "booking": {
    "bookingId": "BK-12345",
    "status": "confirmed",
    "specialRequests": "Updated special requests"
  }
}
```

## 6. Cancel Booking (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Cancel booking with OTP verification

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

# 🎯 Tour APIs

## 1. Get All Tours (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Display tour listings

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

## 2. Filter Tours (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Search tours with filters

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

## 3. Create Tour (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Add new tour

```http
POST /tour/create-tour
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Request Body:
{
  "name": "Mumbai City Tour",
  "description": "Explore the best of Mumbai",
  "duration": "2 days",
  "price": 3500,
  "includes": ["Transport", "Guide", "Meals"],
  "locations": ["Gateway of India", "Marine Drive", "Juhu Beach"],
  "itinerary": [
    {
      "day": 1,
      "activities": ["Pickup from Hotel", "Gateway of India", "Marine Drive"]
    }
  ],
  "images": ["tour1.jpg", "tour2.jpg"]
}

Response:
{
  "success": true,
  "message": "Tour created successfully",
  "tour": {
    "tourId": "TOUR123456",
    "name": "Mumbai City Tour",
    "status": "active"
  }
}
```

---

# 🚗 Cab APIs

## 1. Get All Cabs (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Display available cabs

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

## 2. Filter Cabs (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Search cabs with filters

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

## 3. Add Cab (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Add new cab to system

```http
POST /travel/add-a-car
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Request Body:
{
  "name": "Toyota Innova",
  "type": "SUV",
  "capacity": 7,
  "pricePerKm": 15,
  "driverName": "Rajesh Kumar",
  "driverPhone": "+919876543210",
  "driverLicense": "DL1234567890",
  "amenities": ["AC", "Music System", "Charging Point"],
  "images": ["cab1.jpg"]
}

Response:
{
  "success": true,
  "message": "Car added successfully",
  "car": {
    "carId": "CAB123456",
    "name": "Toyota Innova",
    "status": "active"
  }
}
```

---

# 👤 User Management APIs

## 1. Get User Profile (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: View user profile

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

## 2. Update User Profile (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Update user information

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

## 3. Get All Users (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: View all users

```http
GET /get/all-users-data/all-data
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "users": [
    {
      "userId": "USR123456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "status": "active",
      "totalBookings": 5,
      "totalSpent": 25000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500
  }
}
```

## 4. Filter Users (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Search users with filters

```http
GET /admin/users/filter?status=active&city=Mumbai&dateFrom=2024-01-01
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "users": [
    {
      "userId": "USR123456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "status": "active",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "bookings": [
        {
          "bookingId": "BK-12345",
          "status": "confirmed"
        }
      ],
      "coupons": [
        {
          "couponCode": "USER123",
          "usedCount": 1
        }
      ]
    }
  ]
}
```

---

# 💰 GST APIs

## 1. Get Current GST (Frontend + Panel)
**Type**: Frontend + Panel  
**Use Case**: Get current GST rate

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

## 2. Create GST (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Set GST rate

```http
POST /gst/create-gst
Authorization: Bearer {admin_token}

Request Body:
{
  "percentage": 18,
  "description": "Hotel and Accommodation GST",
  "effectiveFrom": "2024-01-01"
}

Response:
{
  "success": true,
  "message": "GST created successfully",
  "gst": {
    "id": "GST123",
    "percentage": 18,
    "description": "Hotel and Accommodation GST",
    "status": "active"
  }
}
```

## 3. Update GST (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Update GST rate

```http
PATCH /gst/update-gst
Authorization: Bearer {admin_token}

Request Body:
{
  "percentage": 20,
  "description": "Updated GST rate"
}

Response:
{
  "success": true,
  "message": "GST updated successfully",
  "gst": {
    "id": "GST123",
    "percentage": 20,
    "description": "Updated GST rate",
    "status": "active"
  }
}
```

---

# 📊 Statistics APIs

## 1. Get Booking Statistics (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: View booking analytics

```http
GET /statistics/bookings?period=monthly&year=2024&month=12
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "statistics": {
    "totalBookings": 150,
    "confirmedBookings": 120,
    "cancelledBookings": 30,
    "totalRevenue": 500000,
    "averageBookingValue": 3333,
    "popularHotels": [
      {
        "hotelId": "HTL123456",
        "name": "Grand Plaza Hotel",
        "bookings": 25
      }
    ],
    "popularCities": [
      {
        "city": "Mumbai",
        "bookings": 80
      }
    ]
  }
}
```

## 2. Get User Statistics (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: View user analytics

```http
GET /statistics/users?period=monthly&year=2024&month=12
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "statistics": {
    "totalUsers": 500,
    "activeUsers": 350,
    "newUsers": 25,
    "userRetention": 85,
    "topCities": [
      {
        "city": "Mumbai",
        "users": 200
      }
    ]
  }
}
```

---

# 🔔 Notification APIs

## 1. Get User Notifications (Frontend)
**Type**: Frontend (Mobile & Web)  
**Use Case**: Display user notifications

```http
GET /notification/user/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "notifications": [
    {
      "notificationId": "NOTIF123456",
      "title": "Booking Confirmed",
      "message": "Your booking BK-12345 has been confirmed",
      "type": "booking",
      "read": false,
      "createdAt": "2024-12-20T10:30:00Z"
    }
  ]
}
```

## 2. Create Global Notification (Panel)
**Type**: Panel (Admin Dashboard)  
**Use Case**: Send notifications to all users

```http
POST /notification/global
Authorization: Bearer {admin_token}

Request Body:
{
  "title": "Special Offer",
  "message": "Get 20% off on all bookings this weekend",
  "type": "promotion",
  "targetUsers": "all"
}

Response:
{
  "success": true,
  "message": "Global notification created successfully",
  "notification": {
    "notificationId": "NOTIF789012",
    "title": "Special Offer",
    "message": "Get 20% off on all bookings this weekend"
  }
}
```

---

# 📋 API Usage Guidelines

## 🔐 Authentication
- **Frontend APIs**: Require user token (Bearer token)
- **Panel APIs**: Require admin token (Bearer token)
- **Public APIs**: No authentication required

## 📝 Request Format
- **GET**: Query parameters for filters
- **POST**: JSON body for data creation
- **PUT/PATCH**: JSON body for updates
- **DELETE**: Path parameters for resource identification

## 📊 Response Format
```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {}, // Optional: Response data
  "error": {} // Optional: Error details
}
```

## 🚨 Error Codes
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Invalid/missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **500**: Internal Server Error - Server error

## 🔄 Rate Limiting
- **Frontend APIs**: 100 requests per minute
- **Panel APIs**: 50 requests per minute
- **Authentication APIs**: 10 requests per minute

## 📱 Pagination
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 🎯 API Development Priority

### 🚀 **High Priority** (Core Features)
1. **Authentication APIs** - User login, registration
2. **Hotel APIs** - Search, filter, details
3. **Booking APIs** - Create, view, manage bookings
4. **Coupon APIs** - Apply and manage coupons

### 📈 **Medium Priority** (Enhanced Features)
1. **Tour APIs** - Tour booking system
2. **Cab APIs** - Cab booking system
3. **User Profile APIs** - Profile management
4. **GST APIs** - Tax calculation

### 🔧 **Low Priority** (Admin Features)
1. **Panel APIs** - Admin dashboard
2. **Statistics APIs** - Analytics
3. **Notification APIs** - User notifications
4. **Content Management APIs** - Website content

---

## 📞 Support & Contact

### 🛠️ **Development Team**
- **API Documentation**: Available in this file
- **Testing Environment**: Contact development team
- **Production Deployment**: Follow deployment guidelines

### 📧 **Contact Information**
- **Technical Support**: api-support@hotelroomsstay.com
- **Documentation Issues**: docs@hotelroomsstay.com
- **Feature Requests**: features@hotelroomsstay.com

---

*This integration documentation covers all essential APIs for HotelRoomsStay platform. For any additional requirements or clarifications, please contact the development team.*
