# API Endpoints

Base URL: `http://192.168.31.147:5000`  
Production URL: `https://hotelroomsstay.com/api`

---

## Auth

| Method | Endpoint |
|--------|----------|
| POST | `/signIn` |
| POST | `/Signup` |
| POST | `/send-otp` |
| POST | `/verify-otp` |
| POST | `/mail/send-otp` |
| POST | `/mail/verify-otp` |

---

## User

| Method | Endpoint |
|--------|----------|
| GET | `/get/:userId` |
| PUT | `/update` |

---

## Hotels

| Method | Endpoint |
|--------|----------|
| GET | `/hotels/filters` |
| GET | `/hotels/with-active-offers` |
| GET | `/hotels/get-by-id/:id` |
| GET | `/get/offers/main/hotels` |

---

## Hotel Booking

| Method | Endpoint |
|--------|----------|
| POST | `/booking/:userId/:hotelId` |
| GET | `/get/all/users-filtered/booking/by` |
| GET | `/monthly-set-room-price/get/by/:hotelId` |
| GET | `/gst/get-single-gst` |

---

## Tours

| Method | Endpoint |
|--------|----------|
| GET | `/get-all-tours` |
| GET | `/filter-tour/by-query` |
| GET | `/get-tour/:id` |
| POST | `/tour-booking/create-tour-booking` |
| GET | `/tour-booking/get-users-booking` |

---

## Cabs / Travel

| Method | Endpoint |
|--------|----------|
| GET | `/travel/get-all-car` |
| GET | `/travel/filter-car/by-query` |
| GET | `/travel/get-a-car/:cabId` |
| POST | `/travel//create-travel/booking` |
| GET | `/travel/get-bookings-by/user/:userId` |

---

## Coupons

| Method | Endpoint |
|--------|----------|
| POST | `/user-coupon/get-default-coupon/user` |
| PATCH | `/user-coupon/apply/a/coupon-to-room/user` |

---

## Complaints

| Method | Endpoint |
|--------|----------|
| POST | `/create-a-complaint/on/hotel` |
| GET | `/complaints/:userId` |
| POST | `/do/chat-support/:complaintId` |

---

## Notifications

| Method | Endpoint |
|--------|----------|
| POST | `/app/notifications/register-device` |
| GET | `/app/notifications/user/:userId` |
| PATCH | `/app/notifications/:notificationId/seen/:userId` |
| DELETE | `/find/all/by/list/of/user/for/notification/and-delete/user/:notificationId` |

---

## Additional / Misc

| Method | Endpoint |
|--------|----------|
| GET | `/additional/get-bed` |
| GET | `/additional/get-room` |
| GET | `/get-all/travel/location` |
| GET | `/health` |
