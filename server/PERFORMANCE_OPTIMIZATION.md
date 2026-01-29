# Performance Optimization Guide

## Database Indexes for Faster Queries

### Booking Collection Indexes
```javascript
// Add these indexes to improve auto-cancel performance
db.bookings.createIndex({ bookingStatus: 1, createdAt: 1 });
db.bookings.createIndex({ bookingStatus: 1 });
```

### Monthly Pricing Collection Indexes
```javascript
// Add these indexes for faster monthly price lookups
db.monthlyprices.createIndex({ hotelId: 1, roomId: 1 });
db.monthlyprices.createIndex({ startDate: 1, endDate: 1 });
db.monthlyprices.createIndex({ hotelId: 1, roomId: 1, startDate: 1, endDate: 1 });
```

### Hotel Collection Indexes
```javascript
// Add these indexes for faster hotel searches
db.hotels.createIndex({ isAccepted: 1 });
db.hotels.createIndex({ onFront: 1 });
db.hotels.createIndex({ hotelId: 1 });
db.hotels.createIndex({ city: 1 });
db.hotels.createIndex({ state: 1 });
```

## Cron Job Optimizations

### Auto-Cancel Pending Bookings
- **Old Frequency**: Every 15 minutes
- **New Frequency**: Every 30 minutes
- **Optimization**: Runs in background using `setImmediate()`
- **Performance**: Early exit if no pending bookings found (count check)
- **Email Sending**: Disabled by default (can be enabled if needed)

### Monthly Price Update
- **Frequency**: Once per month (1st day at midnight)
- **No change needed**: Already optimal

## Additional Performance Tips

### 1. Enable MongoDB Indexes
Run the index creation commands in your MongoDB shell or compass.

### 2. Disable Email Notifications (Optional)
Email sending in auto-cancel is commented out for better performance. Enable only if required.

### 3. Connection Pooling
Ensure your MongoDB connection uses pooling:
```javascript
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```

### 4. Disable Console Logs in Production
```javascript
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
}
```

### 5. Use Lean() Queries
Always use `.lean()` when you don't need Mongoose document methods:
```javascript
await hotelModel.find().lean();  // ✅ Fast
await hotelModel.find();         // ❌ Slower
```

## Current Optimizations Applied

✅ Reduced auto-cancel frequency from 15 to 30 minutes
✅ Added early exit with count check
✅ Cron jobs run in background with setImmediate()
✅ Email sending disabled by default
✅ Bulk updateMany instead of individual updates
✅ Cursor streaming for large datasets
✅ Parallel Promise.all() for data fetching
✅ Lean queries throughout the codebase

## Monitoring

Watch these logs:
- "Auto-cancelled X pending bookings" - Should be minimal
- API response times - Should be under 500ms for most queries
- Memory usage - Should be stable

## Database Size Management

### Auto-cleanup old monthly prices
Already implemented in `monthly.js`:
```javascript
cron.schedule('0 0 * * *', autoDelete); // Runs daily
```

This automatically deletes expired monthly pricing data.
