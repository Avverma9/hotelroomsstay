# Database Index Recommendations for Hotel Backend

## Important: Add these indexes to improve API performance

### Hotels Collection

Run these commands in MongoDB shell or MongoDB Compass:

```javascript
// Index for isAccepted filter (used in most queries)
db.hotels.createIndex({ "isAccepted": 1 });

// Index for onFront filter
db.hotels.createIndex({ "onFront": 1 });

// Index for hotelId (unique identifier)
db.hotels.createIndex({ "hotelId": 1 }, { unique: true });

// Compound index for filter queries
db.hotels.createIndex({ 
  "isAccepted": 1, 
  "city": 1, 
  "state": 1,
  "starRating": 1 
});

// Index for room filters
db.hotels.createIndex({ "rooms.countRooms": 1 });
db.hotels.createIndex({ "rooms.price": 1 });
db.hotels.createIndex({ "rooms.type": 1 });
db.hotels.createIndex({ "rooms.bedTypes": 1 });
db.hotels.createIndex({ "rooms.isOffer": 1 });

// Index for amenities
db.hotels.createIndex({ "amenities.amenities": 1 });

// Index for search fields
db.hotels.createIndex({ 
  "hotelName": "text", 
  "city": "text", 
  "state": "text", 
  "landmark": "text" 
});

// Index for sorting
db.hotels.createIndex({ "createdAt": -1 });

// Index for propertyType
db.hotels.createIndex({ "propertyType": 1 });

// Index for localId
db.hotels.createIndex({ "localId": 1 });
```

### Bookings Collection

```javascript
// Index for hotelId lookups (critical for availability checks)
db.bookings.createIndex({ "hotelId": 1 });

// Compound index for date range queries
db.bookings.createIndex({ 
  "checkInDate": 1, 
  "checkOutDate": 1 
});

// Compound index for hotelId with dates (most optimized for availability)
db.bookings.createIndex({ 
  "hotelId": 1,
  "checkInDate": 1, 
  "checkOutDate": 1 
});
```

### Monthly Collection

```javascript
// Compound index for monthly price lookups
db.monthlies.createIndex({ 
  "hotelId": 1, 
  "roomId": 1,
  "startDate": 1,
  "endDate": 1
});
```

## How to Apply

### Option 1: MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Select the collection (hotels, bookings, or monthlies)
4. Go to "Indexes" tab
5. Click "Create Index"
6. Paste the index definition

### Option 2: MongoDB Shell
```bash
mongosh "your-connection-string"
use Hotel
# Then paste the index creation commands above
```

### Option 3: Add to Mongoose Models
Add these to your schema definitions:

```javascript
// In models/hotel/basicDetails.js
hotelSchema.index({ isAccepted: 1 });
hotelSchema.index({ hotelId: 1 }, { unique: true });
hotelSchema.index({ isAccepted: 1, city: 1, state: 1, starRating: 1 });
hotelSchema.index({ createdAt: -1 });
hotelSchema.index({ 'rooms.countRooms': 1 });
hotelSchema.index({ 'rooms.price': 1 });

// In models/booking/booking.js
bookingSchema.index({ hotelId: 1, checkInDate: 1, checkOutDate: 1 });

// In models/booking/monthly.js
monthlySchema.index({ hotelId: 1, roomId: 1, startDate: 1, endDate: 1 });
```

## Performance Impact

- **Without indexes**: 5-10+ seconds for filter queries with availability
- **With indexes**: 100-500ms for the same queries

## Monitor Index Usage

```javascript
// Check if indexes are being used
db.hotels.find({ isAccepted: true }).explain("executionStats");
```
