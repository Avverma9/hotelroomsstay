# Bulk Hotel Management API Guide

**Base URL:** `http://localhost:5000`

Ye doc hotel panel ke bulk management endpoints ko ek jagah summarize karta hai.

Covered operations:
- Bulk hotel create
- Bulk hotel status update
- Bulk coupon apply on hotel rooms
- Bulk coupon removal from hotel rooms
- Bulk hotel delete

---

## 1. Bulk Create Hotels

### Endpoint

`POST /hotels/bulk`

### Content-Type

`application/json`  
ya  
`multipart/form-data`

### Request

Raw JSON array bhej sakte ho:

```json
[
  {
    "hotelName": "Hotel Royal One",
    "description": "Comfortable stay in city center",
    "hotelOwnerName": "Aman Verma",
    "destination": "Jaipur",
    "onFront": true,
    "state": "Rajasthan",
    "city": "Jaipur",
    "landmark": "Near Railway Station",
    "pinCode": 302001,
    "hotelCategory": "Premium",
    "numRooms": 20,
    "latitude": "26.9124",
    "longitude": "75.7873",
    "rating": 4.2,
    "starRating": "4",
    "propertyType": ["Hotel", "Resort"],
    "contact": 9876543210,
    "isAccepted": true,
    "salesManagerContact": "9876543211",
    "localId": "Accepted",
    "hotelEmail": "royalone@example.com",
    "customerWelcomeNote": "Welcome to Hotel Royal One",
    "generalManagerContact": "9876543212",
    "images": [
      "https://example.com/hotel-1.jpg"
    ],
    "rooms": [],
    "foods": [],
    "amenities": [],
    "policies": []
  },
  {
    "hotelName": "Hotel Royal Two",
    "city": "Delhi",
    "state": "Delhi",
    "hotelEmail": "royaltwo@example.com",
    "propertyType": ["Hotel"],
    "rooms": []
  }
]
```

`multipart/form-data` me same array ko `payload` field me stringified JSON ke form me bhej sakte ho.

### Success Response `201`

```json
{
  "status": true,
  "message": "Bulk hotels inserted",
  "count": 2,
  "data": [
    {
      "_id": "65f001111111111111111111",
      "hotelId": "12345678",
      "hotelName": "Hotel Royal One"
    },
    {
      "_id": "65f002222222222222222222",
      "hotelId": "87654321",
      "hotelName": "Hotel Royal Two"
    }
  ]
}
```

### Error Response `400`

```json
{
  "status": false,
  "message": "payload must be an array (send as FormData field 'payload' or raw JSON array)"
}
```

---

## 2. Bulk Update Hotels

### Recommended Endpoint

`PATCH /hotels/bulk/update`

### Legacy Endpoint

`PATCH /remove-bulk-hotel-from-hotels/by-hotel/ids`

### Request

```json
{
  "hotelIds": ["12345678", "87654321"],
  "isAccepted": true,
  "onFront": false
}
```

### Supported update fields

- `isAccepted`
- `onFront`
- `soldOut`

### Success Response `200`

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

### Error Response `400`

```json
{
  "message": "hotelIds must be a non-empty array."
}
```

```json
{
  "message": "At least one of isAccepted, soldOut, or onFront must be provided for update."
}
```

### Error Response `404`

```json
{
  "message": "No hotels found with the provided IDs."
}
```

---

## 3. Bulk Apply Coupon On Hotel Rooms

### Recommended Endpoint

`PATCH /coupon/apply-to-hotel-rooms`

### Legacy Endpoint

`PATCH /apply/a/coupon-to-room`

### Request

Specific hotels aur specific rooms par coupon apply:

```json
{
  "couponCode": "HTL2026OFF",
  "hotelIds": ["12345678", "87654321"],
  "roomIds": ["ROOM001", "ROOM002", "ROOM003"]
}
```

Saare eligible rooms par coupon apply:

```json
{
  "couponCode": "HTL2026OFF",
  "hotelIds": ["12345678", "87654321"]
}
```

### Rules

- `couponCode` required hai
- `hotelIds` me kam se kam ek hotelId required hai
- `roomIds` optional hai
- Coupon sirf eligible rooms par apply hota hai
- Room eligible tab hota hai jab:
  - `roomId` valid ho
  - `isOffer` already `true` na ho
  - `countRooms > 0` ho
- Coupon usage limit aur expiry bhi validate hoti hai

### Success Response `200`

```json
{
  "message": "Coupon applied successfully.",
  "couponType": "hotel",
  "appliedRoomIds": ["ROOM001", "ROOM002"],
  "appliedHotelIds": ["12345678", "87654321"],
  "appliedDetails": [
    {
      "hotelId": "12345678",
      "roomId": "ROOM001",
      "originalPrice": 3500,
      "discountPrice": 500,
      "finalPrice": 3000
    },
    {
      "hotelId": "87654321",
      "roomId": "ROOM002",
      "originalPrice": 4200,
      "discountPrice": 500,
      "finalPrice": 3700
    }
  ],
  "usage": {
    "usedCount": 2,
    "maxUsage": 20,
    "remainingQuota": 18
  }
}
```

### Error Response `400`

```json
{
  "message": "couponCode and at least one hotelId are required"
}
```

```json
{
  "message": "Coupon code has expired"
}
```

```json
{
  "message": "Coupon usage limit reached"
}
```

```json
{
  "message": "No eligible rooms found for this coupon"
}
```

### Error Response `404`

```json
{
  "message": "Coupon code not found"
}
```

```json
{
  "message": "No hotels found for provided hotelIds"
}
```

---

## 4. Bulk Remove Coupons From Hotel Rooms

### Recommended Endpoint

`PATCH /hotels/bulk/remove-coupons`

### Legacy Endpoint

`PATCH /remove-bulk-coupons-from-hotels/by-hotel/id`

### Request

```json
{
  "hotelIds": ["12345678", "87654321"]
}
```

### Success Response `200`

```json
{
  "success": true,
  "message": "Active coupons and room offers removed successfully for the selected hotels.",
  "hotelIds": ["12345678", "87654321"],
  "affectedRooms": 5
}
```

### Success Response When Nothing To Remove `200`

```json
{
  "success": true,
  "message": "No active coupons or room offers found for the provided hotels.",
  "hotelIds": ["12345678", "87654321"],
  "affectedRooms": 0
}
```

### Error Response `400`

```json
{
  "message": "hotelIds must be a non-empty array."
}
```

### Error Response `404`

```json
{
  "message": "No hotels found with the provided IDs."
}
```

---

## 5. Bulk Delete Hotels

### Recommended Endpoint

`DELETE /hotels/bulk/delete`

### Legacy Endpoint

`DELETE /delete-bulk-hotels-from-list-of-hotels/by-ids`

### Request

```json
{
  "hotelIds": ["12345678", "87654321"]
}
```

### Success Response `200`

```json
{
  "success": true,
  "message": "2 hotel(s) deleted successfully.",
  "deletedCount": 2,
  "hotelIds": ["12345678", "87654321"]
}
```

### Error Response `400`

```json
{
  "message": "hotelIds must be a non-empty array."
}
```

### Error Response `404`

```json
{
  "message": "No hotels found with the provided IDs."
}
```

---

## 6. Suggested Frontend Payload Summary

### Bulk create

```json
[
  {
    "hotelName": "Hotel A",
    "city": "Jaipur",
    "state": "Rajasthan",
    "hotelEmail": "a@example.com",
    "propertyType": ["Hotel"],
    "rooms": []
  }
]
```

### Bulk status update

```json
{
  "hotelIds": ["12345678", "87654321"],
  "isAccepted": true
}
```

### Bulk coupon apply

```json
{
  "couponCode": "HTL2026OFF",
  "hotelIds": ["12345678", "87654321"],
  "roomIds": ["ROOM001", "ROOM002"]
}
```

### Bulk coupon remove

```json
{
  "hotelIds": ["12345678", "87654321"]
}
```

### Bulk delete

```json
{
  "hotelIds": ["12345678", "87654321"]
}
```

---

## 7. Notes

- Hotel bulk create route `multipart/form-data` ke saath bhi kaam karta hai, lekin easiest option raw JSON array hai.
- Bulk update currently hotel-level flags update karta hai, full hotel detail patch nahi.
- Bulk coupon apply hotel rooms par kaam karta hai, not user coupon flow.
- Bulk remove coupon sirf active room offers ko reset karta hai.
- Bulk delete permanent delete operation hai.
