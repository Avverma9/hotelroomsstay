# App Notification API Guide

## Base URL
`http://localhost:5000`

## 1) Get Notifications by `userId`
- Method: `GET`
- URL: `/app/notifications/user/:userId`

### Example
`GET /app/notifications/user/12345678`

### Sample Response (200)
```json
[
  {
    "_id": "67c14d9a4f497fb3bc8d2f20",
    "name": "Coupon Received",
    "path": "/app/coupons",
    "message": "Welcome! You received coupon 728193 worth Rs 50. Valid till 07 Mar 2026.",
    "eventType": "coupon_assigned",
    "metadata": {
      "couponCode": "728193",
      "discountPrice": 50,
      "validity": "2026-03-07T07:30:00.000Z"
    },
    "seenBy": {
      "12345678": false
    },
    "userIds": [
      "12345678"
    ],
    "createdAt": "2026-02-28T10:16:12.735Z",
    "updatedAt": "2026-02-28T10:16:12.735Z",
    "__v": 0,
    "seen": false
  }
]
```

## 2) Mark Notification as Seen
- Method: `PATCH`
- URL: `/app/notifications/:notificationId/seen/:userId`

### Example
`PATCH /app/notifications/67c14d9a4f497fb3bc8d2f20/seen/12345678`

### Sample Response (200)
```json
{
  "_id": "67c14d9a4f497fb3bc8d2f20",
  "name": "Coupon Received",
  "path": "/app/coupons",
  "message": "Welcome! You received coupon 728193 worth Rs 50. Valid till 07 Mar 2026.",
  "eventType": "coupon_assigned",
  "metadata": {
    "couponCode": "728193",
    "discountPrice": 50,
    "validity": "2026-03-07T07:30:00.000Z"
  },
  "seenBy": {
    "12345678": true
  },
  "userIds": [
    "12345678"
  ],
  "createdAt": "2026-02-28T10:16:12.735Z",
  "updatedAt": "2026-02-28T10:17:55.281Z",
  "__v": 0
}
```

## 3) Manual Push Notification (for testing)
- Method: `POST`
- URL: `/push-a-new-notification-to-the-panel/dashboard/user`
- Body (JSON):
```json
{
  "name": "Test Notification",
  "message": "This is a test notification for mobile app.",
  "path": "/app/notifications",
  "eventType": "general",
  "metadata": {
    "source": "manual-test"
  },
  "userIds": ["12345678"]
}
```

## Auto-Created `eventType` Values
- `coupon_assigned`
- `coupon_expired`
- `hotel_booking_success`
- `hotel_booking_confirmed`
- `travel_booking_success`
- `travel_booking_confirmed`
- `tour_booking_success`
- `tour_booking_confirmed`
- `complaint_created`
- `complaint_status_changed`
- `password_changed`

## Notes
- `seen` field is computed in GET response for requested user.
- Notifications are stored in `UserNotification` collection.
