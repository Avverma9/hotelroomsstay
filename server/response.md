# Hotel Create/Update + Food/Room/Policy/Amenities API Payloads

## Base URL
`http://localhost:5000`

## Important Notes
- `hotel`, `room`, and `food` create/update endpoints use `multipart/form-data`.
- Upload middleware `upload.any()` use karta hai, isliye image files kisi bhi file field name se bhej sakte ho.
- `food` aur `amenities` ke liye current backend me dedicated `update` endpoint nahi hai.
- `PATCH /patch-a-new/policy-to-your/hotel` sirf wahi fields update karta hai jinki value empty string (`""`) nahi hoti.
- `PATCH /update-hotels-image-by-hotel-id/:hotelId` route ka naam `hotelId` bolta hai, lekin controller `findById(hotelId)` use karta hai. Is route me practical input Mongo `_id` jaisa behave karta hai.
- Hotel create endpoint basic hotel document banata hai. `rooms`, `foods`, `amenities`, aur `policies` alag APIs se manage hote hain.

## 1) Add Hotel

- Method: `POST`
- URL: `/data/hotels-new/post/upload/data`
- Content-Type: `multipart/form-data`

### Request Payload
```js
{
  hotelName: "Hotel Prime Palace",
  description: "City center hotel with restaurant and parking",
  hotelOwnerName: "Rohit Sharma",
  destination: "Jaipur",
  onFront: false,
  startDate: "2026-03-20T00:00:00.000Z",
  endDate: "2026-12-31T00:00:00.000Z",
  state: "Rajasthan",
  city: "Jaipur",
  landmark: "Near Sindhi Camp",
  pinCode: 302001,
  hotelCategory: "Premium",
  latitude: "26.9124",
  longitude: "75.7873",
  rating: 4.3,
  starRating: "4",
  propertyType: ["Hotel", "Family Stay"],
  contact: 9876543210,
  isAccepted: false,
  salesManagerContact: "9876500001",
  generalManagerContact: "9876500002",
  localId: "Accepted",
  hotelEmail: "hotelprime@example.com",
  customerWelcomeNote: "Welcome to Hotel Prime Palace",
  images: [File, File]
}
```

### Response Payload (201)
```json
{
  "message": "Your request is accepted. Kindly note your hotel id (12345678) for future purposes.",
  "status": true,
  "data": {
    "_id": "67ce4a0c3f0fd0d32e8c1111",
    "hotelId": "12345678",
    "images": [
      "https://bucket.s3.amazonaws.com/1741590000000-hotel-1.jpg",
      "https://bucket.s3.amazonaws.com/1741590000001-hotel-2.jpg"
    ],
    "hotelName": "Hotel Prime Palace",
    "description": "City center hotel with restaurant and parking",
    "hotelOwnerName": "Rohit Sharma",
    "destination": "Jaipur",
    "onFront": false,
    "state": "Rajasthan",
    "city": "Jaipur",
    "latitude": "26.9124",
    "longitude": "75.7873",
    "landmark": "Near Sindhi Camp",
    "pinCode": 302001,
    "hotelCategory": "Premium",
    "startDate": "2026-03-20T00:00:00.000Z",
    "endDate": "2026-12-31T00:00:00.000Z",
    "rating": 4.3,
    "reviewCount": 0,
    "starRating": "4",
    "propertyType": ["Hotel", "Family Stay"],
    "contact": 9876543210,
    "isAccepted": false,
    "rooms": [],
    "foods": [],
    "amenities": [],
    "policies": [],
    "localId": "Accepted",
    "hotelEmail": "hotelprime@example.com",
    "generalManagerContact": "9876500002",
    "salesManagerContact": "9876500001",
    "customerWelcomeNote": "Welcome to Hotel Prime Palace",
    "createdAt": "2026-03-10T10:00:00.000Z",
    "updatedAt": "2026-03-10T10:00:00.000Z",
    "__v": 0
  }
}
```

## 2) Update Hotel Basic Info

- Method: `PATCH`
- URL: `/hotels/update/info/:hotelId`
- Content-Type: `application/json`

### Request Payload
```json
{
  "isAccepted": true,
  "onFront": true,
  "hotelName": "Hotel Prime Palace Deluxe",
  "hotelOwnerName": "Rohit Sharma",
  "hotelEmail": "hotelprime@example.com",
  "localId": "Accepted",
  "description": "Renovated property with upgraded rooms",
  "customerWelcomeNote": "Welcome to our renovated property",
  "generalManagerContact": "9876500002",
  "salesManagerContact": "9876500001",
  "landmark": "Near Railway Station",
  "pinCode": 302006,
  "hotelCategory": "Luxury",
  "propertyType": ["Hotel", "Business Stay"],
  "starRating": "5",
  "city": "Jaipur",
  "state": "Rajasthan"
}
```

### Response Payload (200)
```json
{
  "_id": "67ce4a0c3f0fd0d32e8c1111",
  "hotelId": "12345678",
  "images": [
    "https://bucket.s3.amazonaws.com/1741590000000-hotel-1.jpg"
  ],
  "hotelName": "Hotel Prime Palace Deluxe",
  "description": "Renovated property with upgraded rooms",
  "hotelOwnerName": "Rohit Sharma",
  "destination": "Jaipur",
  "onFront": true,
  "state": "Rajasthan",
  "city": "Jaipur",
  "landmark": "Near Railway Station",
  "pinCode": 302006,
  "hotelCategory": "Luxury",
  "starRating": "5",
  "propertyType": ["Hotel", "Business Stay"],
  "isAccepted": true,
  "localId": "Accepted",
  "hotelEmail": "hotelprime@example.com",
  "generalManagerContact": "9876500002",
  "salesManagerContact": "9876500001",
  "customerWelcomeNote": "Welcome to our renovated property",
  "rooms": [],
  "foods": [],
  "amenities": [],
  "policies": [],
  "createdAt": "2026-03-10T10:00:00.000Z",
  "updatedAt": "2026-03-10T12:30:00.000Z",
  "__v": 0
}
```

## 3) Update Hotel Status / Front Visibility

- Method: `PATCH`
- URL: `/hotels/update/:hotelId`
- Content-Type: `application/json`

### Request Payload
```json
{
  "isAccepted": true,
  "onFront": false
}
```

### Response Payload (200)
```json
{
  "success": true,
  "data": {
    "_id": "67ce4a0c3f0fd0d32e8c1111",
    "hotelId": "12345678",
    "isAccepted": true,
    "onFront": false,
    "hotelEmail": "hotelprime@example.com",
    "updatedAt": "2026-03-10T12:45:00.000Z"
  }
}
```

## 4) Add Food to Hotel

- Method: `POST`
- URL: `/add/food-to/your-hotel`
- Content-Type: `multipart/form-data`

### Request Payload
```js
{
  hotelId: "12345678",
  name: "Breakfast Buffet",
  foodType: "Veg",
  about: "Unlimited breakfast buffet from 7 AM to 10 AM",
  price: 299,
  images: [File]
}
```

### Response Payload (201)
```json
{
  "message": "Food item added successfully",
  "created": {
    "foodId": "a1b2c3d4",
    "hotelId": "12345678",
    "name": "Breakfast Buffet",
    "foodType": "Veg",
    "about": "Unlimited breakfast buffet from 7 AM to 10 AM",
    "images": [
      "https://bucket.s3.amazonaws.com/1741590000100-breakfast.jpg"
    ],
    "price": 299
  }
}
```

## 5) Edit Food

Current backend me dedicated `update food` API available nahi hai.

- Existing options:
  - `DELETE /delete-food/:hotelId/:foodId`
  - Fir `POST /add/food-to/your-hotel` se naya food item create karo

## 6) Add Room to Hotel

- Method: `POST`
- URL: `/create-a-room-to-your-hotel`
- Content-Type: `multipart/form-data`

### Request Payload
```js
{
  hotelId: "12345678",
  type: "Deluxe",
  bedTypes: "King Bed",
  price: 3200,
  countRooms: 8,
  soldOut: false,
  images: [File, File]
}
```

### Response Payload (201)
```json
{
  "message": "Created",
  "createdRoom": {
    "roomId": "d4e5f6g7",
    "hotelId": "12345678",
    "images": [
      "https://bucket.s3.amazonaws.com/1741590000200-room-1.jpg",
      "https://bucket.s3.amazonaws.com/1741590000201-room-2.jpg"
    ],
    "soldOut": false,
    "countRooms": 8,
    "totalRooms": 8,
    "price": 3200,
    "originalPrice": 3200,
    "isOffer": false,
    "offerName": "N/A",
    "offerPriceLess": 0,
    "offerExp": null,
    "type": "Deluxe",
    "bedTypes": "King Bed"
  },
  "updatedHotel": {
    "_id": "67ce4a0c3f0fd0d32e8c1111",
    "hotelId": "12345678",
    "rooms": [
      {
        "roomId": "d4e5f6g7",
        "type": "Deluxe",
        "bedTypes": "King Bed",
        "price": 3200
      }
    ],
    "...": "other hotel fields"
  }
}
```

## 7) Edit Room

- Method: `PATCH`
- URL: `/update-your/room`
- Content-Type: `multipart/form-data`

### Request Payload
```js
{
  roomId: "d4e5f6g7",
  type: "Super Deluxe",
  bedTypes: "King Bed",
  price: 3600,
  countRooms: 6,
  totalRooms: 8,
  soldOut: false,
  images: [File]
}
```

### Response Payload (200)
```json
{
  "message": "Rooms updated successfully",
  "data": [
    {
      "roomId": "d4e5f6g7",
      "hotelId": "12345678",
      "images": [
        "https://bucket.s3.amazonaws.com/1741590000300-room-new.jpg"
      ],
      "type": "Super Deluxe",
      "bedTypes": "King Bed",
      "price": 3600,
      "originalPrice": 3600,
      "isOffer": false,
      "offerName": "N/A",
      "offerPriceLess": 0,
      "offerExp": null,
      "soldOut": false,
      "countRooms": 6,
      "totalRooms": 8
    }
  ]
}
```

## 8) Add Policy to Hotel

- Method: `POST`
- URL: `/add-a-new/policy-to-your/hotel`
- Content-Type: `application/json`

### Request Payload
```json
{
  "hotelId": "12345678",
  "hotelsPolicy": "Valid ID mandatory at check-in. Pets are not allowed.",
  "checkInPolicy": "Check-in after 12 PM",
  "checkOutPolicy": "Check-out before 11 AM",
  "outsideFoodPolicy": "Outside food not allowed",
  "cancellationPolicy": "Free cancellation before 24 hours",
  "paymentMode": "UPI, Card, Cash",
  "petsAllowed": "No",
  "bachelorAllowed": "Yes",
  "smokingAllowed": "No",
  "alcoholAllowed": "No",
  "unmarriedCouplesAllowed": "Yes",
  "internationalGuestAllowed": "Yes",
  "returnPolicy": "Non-refundable after check-in"
}
```

### Response Payload (201)
```json
{
  "message": "Policy created",
  "createdPolicies": {
    "hotelId": "12345678",
    "hotelsPolicy": "Valid ID mandatory at check-in. Pets are not allowed.",
    "checkInPolicy": "Check-in after 12 PM",
    "checkOutPolicy": "Check-out before 11 AM",
    "outsideFoodPolicy": "Outside food not allowed",
    "cancellationPolicy": "Free cancellation before 24 hours",
    "paymentMode": "UPI, Card, Cash",
    "petsAllowed": "No",
    "bachelorAllowed": "Yes",
    "smokingAllowed": "No",
    "alcoholAllowed": "No",
    "unmarriedCouplesAllowed": "Yes",
    "internationalGuestAllowed": "Yes",
    "returnPolicy": "Non-refundable after check-in"
  }
}
```

## 9) Edit Policy Field-by-Field

- Method: `PATCH`
- URL: `/patch-a-new/policy-to-your/hotel`
- Content-Type: `application/json`

### Request Payload
```json
{
  "hotelId": "12345678",
  "checkInPolicy": "Check-in after 1 PM",
  "checkOutPolicy": "Check-out before 10 AM",
  "outsideFoodPolicy": "Outside food allowed in rooms only",
  "unmarriedCouplesAllowed": "Yes",
  "smokingAllowed": "No",
  "onDoubleSharing": "1500",
  "offDoubleSharing": "1200",
  "onDoubleSharingAp": "1800",
  "offDoubleSharingAp": "1500",
  "onDoubleSharingMAp": "2200",
  "offDoubleSharingMAp": "1900"
}
```

### Response Payload (200)
```json
{
  "message": "Policies updated successfully",
  "data": {
    "_id": "67ce4a0c3f0fd0d32e8c1111",
    "hotelId": "12345678",
    "policies": [
      {
        "hotelId": "12345678",
        "checkInPolicy": "Check-in after 1 PM",
        "checkOutPolicy": "Check-out before 10 AM",
        "outsideFoodPolicy": "Outside food allowed in rooms only",
        "unmarriedCouplesAllowed": "Yes",
        "smokingAllowed": "No",
        "onDoubleSharing": "1500",
        "offDoubleSharing": "1200",
        "onDoubleSharingAp": "1800",
        "offDoubleSharingAp": "1500",
        "onDoubleSharingMAp": "2200",
        "offDoubleSharingMAp": "1900"
      }
    ],
    "...": "other hotel fields"
  }
}
```

### Extra Supported Policy Keys
`hotelsPolicy`, `outsideFoodPolicy`, `cancellationPolicy`, `paymentMode`, `petsAllowed`, `checkInPolicy`, `checkOutPolicy`, `bachelorAllowed`, `smokingAllowed`, `alcoholAllowed`, `unmarriedCouplesAllowed`, `internationalGuestAllowed`, `returnPolicy`, `onDoubleSharing`, `onQuadSharing`, `onBulkBooking`, `onTrippleSharing`, `onMoreThanFour`, `offDoubleSharing`, `offQuadSharing`, `offBulkBooking`, `offTrippleSharing`, `offMoreThanFour`, `onDoubleSharingAp`, `onQuadSharingAp`, `onBulkBookingAp`, `onTrippleSharingAp`, `onMoreThanFourAp`, `onDoubleSharingMAp`, `onQuadSharingMAp`, `onBulkBookingMAp`, `onTrippleSharingMAp`, `onMoreThanFourMAp`, `offDoubleSharingAp`, `offQuadSharingAp`, `offBulkBookingAp`, `offTrippleSharingAp`, `offMoreThanFourAp`, `offDoubleSharingMAp`, `offQuadSharingMAp`, `offBulkBookingMAp`, `offTrippleSharingMAp`, `offMoreThanFourMAp`

## 10) Replace Full Policies Array for a Hotel

- Method: `PATCH`
- URL: `/update-hotels-policy-by-hotel-id/:hotelId`
- Content-Type: `application/json`

### Request Payload
```json
{
  "policies": [
    {
      "hotelId": "12345678",
      "hotelsPolicy": "Carry valid government ID",
      "checkInPolicy": "12 PM",
      "checkOutPolicy": "11 AM",
      "outsideFoodPolicy": "Not allowed"
    }
  ]
}
```

### Response Payload (200)
```json
{
  "message": "Policies updated successfully",
  "policies": [
    {
      "hotelId": "12345678",
      "hotelsPolicy": "Carry valid government ID",
      "checkInPolicy": "12 PM",
      "checkOutPolicy": "11 AM",
      "outsideFoodPolicy": "Not allowed"
    }
  ]
}
```

## 11) Add Amenities to Hotel

- Method: `POST`
- URL: `/create-a-amenities/to-your-hotel`
- Content-Type: `application/json`

### Request Payload
```json
{
  "hotelId": "12345678",
  "amenities": [
    "Free WiFi",
    "Parking",
    "Restaurant",
    "Power Backup",
    "Lift"
  ]
}
```

### Response Payload (201)
```json
{
  "hotelId": "12345678",
  "amenities": [
    "Free WiFi",
    "Parking",
    "Restaurant",
    "Power Backup",
    "Lift"
  ]
}
```

## 12) Edit Amenities

Current backend me dedicated `update amenities` API available nahi hai.

- Existing options:
  - `DELETE /hotels/:hotelId/amenities/:amenityName`
  - Fir `POST /create-a-amenities/to-your-hotel` se updated list dubara add karo

## 13) Create Hotel Booking

- Method: `POST`
- URL: `/booking/:userId/:hotelId`
- Content-Type: `application/json`

### Request Payload
```json
{
  "checkInDate": "2026-03-20",
  "checkOutDate": "2026-03-22",
  "guests": 2,
  "guestDetails": {
    "fullName": "Amit Sharma",
    "mobile": "9876543210",
    "email": "amit@example.com"
  },
  "numRooms": 1,
  "foodDetails": [
    {
      "foodId": "fd1001",
      "name": "Breakfast Buffet",
      "price": 299,
      "quantity": 2
    }
  ],
  "roomDetails": [
    {
      "roomId": "d4e5f6g7",
      "type": "Deluxe",
      "bedTypes": "King Bed",
      "price": 3200
    }
  ],
  "couponCode": "728193",
  "discountPrice": 500,
  "bookingStatus": "Pending",
  "pm": "UPI",
  "bookingSource": "App",
  "hotelName": "Hotel Prime Palace",
  "hotelEmail": "hotelprime@example.com",
  "hotelCity": "Jaipur",
  "hotelOwnerName": "Rohit Sharma",
  "destination": "Jaipur"
}
```

### Response Payload (201)
```json
{
  "success": true,
  "data": {
    "_id": "67ce4d0d3f0fd0d32e8c2222",
    "bookingId": "AB12CD34EF",
    "user": {
      "userId": "23533101",
      "profile": ["https://bucket.s3.amazonaws.com/user.jpg"],
      "name": "Amit Sharma",
      "email": "amit@example.com",
      "mobile": "9876543210"
    },
    "hotelDetails": {
      "hotelCity": "Jaipur",
      "hotelId": "12345678",
      "hotelName": "Hotel Prime Palace",
      "hotelEmail": "hotelprime@example.com",
      "hotelOwnerName": "Rohit Sharma",
      "destination": "Jaipur"
    },
    "foodDetails": [
      {
        "foodId": "fd1001",
        "name": "Breakfast Buffet",
        "price": 299,
        "quantity": 2
      }
    ],
    "roomDetails": [
      {
        "roomId": "d4e5f6g7",
        "type": "Deluxe",
        "bedTypes": "King Bed",
        "price": 3200
      }
    ],
    "numRooms": 1,
    "gstPrice": 12,
    "gstAmount": 708,
    "foodPrice": 598,
    "baseRoomPrice": 6400,
    "discountedRoomPrice": 5900,
    "checkInDate": "2026-03-20",
    "checkOutDate": "2026-03-22",
    "guests": 2,
    "guestDetails": {
      "fullName": "Amit Sharma",
      "mobile": "9876543210",
      "email": "amit@example.com"
    },
    "price": 7206,
    "couponCode": "728193",
    "discountPrice": 500,
    "pm": "UPI",
    "bookingStatus": "Pending",
    "bookingSource": "App",
    "destination": "Jaipur",
    "isPartialBooking": false,
    "partialAmount": 0,
    "createdAt": "2026-03-10T18:40:00.000Z",
    "updatedAt": "2026-03-10T18:40:00.000Z",
    "__v": 0
  }
}
```

## 14) Hotel Booking Logic

### Price Calculation Flow
1. `userId` param se user fetch hota hai. User missing ho to `404 User not found`.
2. `bookingId` backend randomly 10-character alphanumeric string generate karta hai.
3. Nights calculate hoti hain:
```txt
nights = max(1, ceil(checkOutDate - checkInDate in days))
```
4. Base room calculation current code me sirf first room ka price use karke hota hai:
```txt
perRoomPrice = roomDetails[0].price
roomBaseTotal = perRoomPrice * numRooms * nights
```
5. Discount body se direct uthaya jata hai:
```txt
discountAmount = discountPrice || 0
discountedRoomTotal = max(0, roomBaseTotal - discountAmount)
```
6. GST discounted per-room-per-night threshold par resolve hota hai:
```txt
gstThreshold = discountedRoomTotal / numRooms / nights
gstRate = GST(type="Hotel", threshold=gstThreshold)
gstAmount = discountedRoomTotal * gstRate / 100
```
7. Food total:
```txt
foodPrice = sum(food.price * food.quantity)
```
8. Final payable amount:
```txt
finalPrice = discountedRoomTotal + gstAmount + foodPrice
```

### Booking Side Effects
1. Booking save hone ke baad confirmation mail send hota hai.
2. Har `roomDetails` item ke liye matching hotel room ka `countRooms` `-1` kiya jata hai.
3. User notification create hoti hai with event type `hotel_booking_success`.

### Important Booking Notes
- Current booking API `couponCode` aur `discountPrice` ko body se trust karta hai; coupon validity is endpoint par re-check nahi hoti.
- Coupon/offer room level par alag API se apply hota hai; booking API uska discounted amount sirf input ke roop me use karta hai.
- Current implementation me price calculation `roomDetails[0].price` use karti hai, isliye mixed room-price booking me manual validation zaroori hai.

## 15) Create Hotel Coupon

- Method: `POST`
- URL: `/coupon/create-a-new/coupon`
- Content-Type: `application/json`

### Request Payload
```json
{
  "couponName": "SUMMER500",
  "discountPrice": 500,
  "validity": "2026-06-30T23:59:59.000Z",
  "quantity": 10,
  "maxUsage": 10
}
```

### Response Payload (201)
```json
{
  "message": "Coupon code created",
  "coupon": {
    "_id": "67ce4e0d3f0fd0d32e8c3333",
    "couponCode": "728193",
    "type": "hotel",
    "couponName": "SUMMER500",
    "discountPrice": 500,
    "validity": "2026-06-30T23:59:59.000Z",
    "expired": false,
    "quantity": 10,
    "maxUsage": 10,
    "usedCount": 0,
    "roomId": [],
    "hotelId": [],
    "usageHistory": [],
    "createdAt": "2026-03-10T18:45:00.000Z",
    "updatedAt": "2026-03-10T18:45:00.000Z",
    "__v": 0
  }
}
```

## 16) Apply Coupon to Hotel Rooms

- Method: `PATCH`
- URL: `/apply/a/coupon-to-room`
- Alias URL: `/coupon/apply-to-hotel-rooms`
- Content-Type: `application/json`

### Request Payload
```json
{
  "couponCode": "728193",
  "hotelIds": ["12345678"],
  "roomIds": ["d4e5f6g7", "r8s9t0u1"]
}
```

### Response Payload (200)
```json
{
  "message": "Coupon applied successfully.",
  "couponType": "hotel",
  "appliedRoomIds": ["d4e5f6g7", "r8s9t0u1"],
  "appliedHotelIds": ["12345678"],
  "appliedDetails": [
    {
      "hotelId": "12345678",
      "roomId": "d4e5f6g7",
      "originalPrice": 3200,
      "discountPrice": 500,
      "finalPrice": 2700
    },
    {
      "hotelId": "12345678",
      "roomId": "r8s9t0u1",
      "originalPrice": 2800,
      "discountPrice": 500,
      "finalPrice": 2300
    }
  ],
  "usage": {
    "usedCount": 2,
    "maxUsage": 10,
    "remainingQuota": 8
  }
}
```

## 17) Coupon Apply Logic

### Validation Flow
1. `couponCode` mandatory hai.
2. At least ek `hotelId` dena mandatory hai.
3. Coupon lookup `couponCode + type=hotel` par hota hai.
4. Coupon invalid cases:
   - coupon not found
   - coupon expired
   - `usedCount >= maxUsage/quantity`
5. Hotel list `hotelIds` se fetch hoti hai. Koi hotel na mile to `404`.

### Eligible Room Rules
Room tabhi eligible hota hai jab:
- `roomId` present ho
- agar `roomIds` payload me bheja hai to room us list me ho
- `room.isOffer !== true`
- `room.countRooms > 0`

### Room Update Logic
Har eligible room par backend ye fields set karta hai:
```json
{
  "offerName": "coupon.couponName",
  "offerPriceLess": "coupon.discountPrice",
  "offerExp": "coupon.validity",
  "isOffer": true,
  "price": "basePrice",
  "originalPrice": "basePrice"
}
```

### Final Price Logic
```txt
basePrice = getRoomBasePrice(room)
finalPrice = max(0, basePrice - coupon.discountPrice)
```

### Coupon Usage Logic
1. Har successfully applied room usage count ko `+1` karta hai.
2. `coupon.roomId` aur `coupon.hotelId` arrays me applied IDs merge hote hain.
3. `usageHistory` me `hotelId`, `roomId`, `discountPrice`, `finalPrice` store hota hai.
4. Remaining quota `0` hote hi coupon `expired = true` ho jata hai.

### Important Coupon Notes
- `hotelIds` aur `roomIds` payload me array format me bhejo. String value bhejne par current normalization usse valid list nahi banata.
- Coupon apply endpoint room document me discounted `finalPrice` persist nahi karta; backend `offerPriceLess` aur `originalPrice` store karta hai.
- Discounted price baad me hotel/room fetch karte waqt `offerUtils.getOfferAdjustedPrice()` se derive hota hai.
- Agar saare selected rooms par already offer laga hua ho ya `countRooms = 0` ho, to response aata hai: `No eligible rooms found for this coupon`.
- Existing options:
  - `DELETE /hotels/:hotelId/amenities/:amenityName`
  - Fir `POST /create-a-amenities/to-your-hotel` se updated list dubara add karo
