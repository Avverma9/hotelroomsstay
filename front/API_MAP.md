# HotelRoomsStay Frontend → Backend API Map (Feb 2026)

Base URL configured in `src/utils/baseURL.js`:
- `https://hotelroomsstay.com/api`

Axios wrapper: `src/utils/apiInterceptor.js`
- Attaches `Authorization: Bearer <authToken>` if `localStorage.authToken` exists.
- Default `Content-Type: application/json`, `timeout: 100000ms`.
- Health ping: GET `${baseURL}/health` (used only for status UI).

Below is every endpoint the frontend calls, with purpose, method, expected params, and observed response envelope. “data” refers to `response.data` unless stated otherwise.

## Auth
- POST `/api/auth/login` — Body: `{ email, password }`. Returns user + tokens (data structure consumed directly by UI).
- POST `/api/auth/register` — Body: new user payload. Returns created user object.
- POST `/api/auth/logout` — No body. Returns status message.
- GET `/api/auth/me` — Returns current user profile.
- POST `/api/auth/refresh` — Returns refreshed tokens.
- POST `/signIn` — Login flow used in `pages/LoginPage.jsx`; Body `{ email, password }`. Expects user + token.
- POST `/send-otp` or `/mail/send-otp` — Chosen by checkbox; Body `{ email }`. Returns OTP send status.
- POST `/verify-otp` or `/mail/verify-otp/site` — Body `{ email, otp }`. Returns verification status.
- POST `/Signup` — Registration flow in `RegisterPage.jsx`; multipart form allowed. Returns created user.

## Hotels & Search
- GET `/hotels/filters?search=<dest>&checkInDate=<yyyy-mm-dd>&checkOutDate=<yyyy-mm-dd>&countRooms=<n>&guests=<n>&page=<n>&limit=<n>` — Hotel search. Response: `{ data: [hotels] }` or `[hotels]`; slice normalizes ids to `hotelId`/`_id`.
- GET `/get/offers/main/hotels` — Featured/offer hotels. Response: array; UI shows up to 12.
- GET `/getReviews/hotelId?hotelId=<id>` — Reviews list for hotel.
- GET `/hotels/get-by-id/<hotelId>` — Detailed booking data for a hotel.

## Room Pricing & Availability
- GET `/monthly-set-room-price/get/by/<hotelId>` — Monthly room price grid. Response expected as `{ data: {...} }` or direct object.

## Booking Flow
- POST `/booking/<userId>/<hotelId>` — Creates room booking (see `src/services/bookingService.js`); Body `payload` with guest/room info. Returns booking record.
- POST `/create-order` — Initiates payment order; Body `{ amount, currency, receipt? }`. Returns payment gateway order payload.
- GET `/get/all/users-filtered/booking/by?` + query params — Admin/filtered bookings; response envelope `{ success, data, html, pagination }` kept intact.
- DELETE `/api/bookings/<bookingId>` — Cancel booking (generic service layer).
- PUT `/api/bookings/<bookingId>` — Update booking.
- GET `/api/bookings/user` — Bookings for logged-in user (generic service layer).
- GET `/api/bookings/<bookingId>` — Single booking (generic service layer).

## Coupons & GST
- PATCH `/user-coupon/apply/a/coupon-to-room/user` — Body `payload` with coupon code + booking context. Response normalized; success toast shown.
- POST `/user-coupon/get-default-coupon/user` — Body `{ email }`; returns default coupon list for user.
- GET `/gst/get-single-gst?type=<Hotel|...>&gstThreshold=<number|comma list>` — Returns GST rule/percentage for pricing.

## User Profile
- GET `/get/<userId>` — Fetch profile. Response shape `{ data: { ...user } }`; also stores `userImage[0]` in localStorage.
- PUT `/update` — Update profile (multipart allowed). Body: form-data fields for user profile; returns status.
- PUT `/api/users/profile` — Generic service; update logged-in user profile (JSON body).
- POST `/api/users/profile/picture` — Upload profile image; multipart form-data.
- PUT `/api/users/password` — Change password; Body `{ currentPassword, newPassword }`.
- GET `/api/users/profile` — Get profile (generic service layer).

## Complaints
- POST `/create-a-complaint/on/hotel` — Multipart/form-data with complaint info + images; returns saved complaint.
- GET `/complaints/<userId>` — Logged-in user complaints list.
- DELETE `/delete-a-particular/complaints/delete/by/id/<id>` — Remove complaint by id.
- GET `/get/all/filtered/booking/by/query?bookingId=<id>` — Helper lookup when filing complaints.

## Mail / Notifications
- POST `/mail/send-booking-mail` — Body `payload` with booking details; triggers transactional email.
- POST `/mail/send-message` — Body `payload` with contact form message.

## Location & Static Data
- GET `/get-all/travel/location` — Travel location shortcuts list used in UI filters.

## Tours / Travel Packages
- POST `/create-tour` — Partner creates a tour (multipart allowed). Returns created tour; success toast.
- GET `/get-tour-list` — Public tour list; response uses `.data.data`.
- GET `/sort-tour/by-price?minPrice=<min>&maxPrice=<max>` — Filter tours by price range.
- GET `/sort-tour/by-duration?minNights=<min>&maxNights=<max>` — Filter tours by duration.
- GET `/sort-tour/by-themes?themes=<commaSeparated>` — Filter tours by themes.
- GET `/sort-tour/by-order?sort=<asc|desc|popular>` — Sorting helper.
- GET `/get-tour/<id>` — Single tour detail; returned under `data.data`.
- POST `/tour-booking/create-tour-booking` — Create a tour booking; Body includes traveler + package info.
- GET `/tour-booking/get-users-booking?userId=<userId>` — User’s tour bookings. In code, `userId` injected as query param.
- GET `/tours/<tourId>/vehicles/<vehicleId>/seats` — Seat map for a tour vehicle; response expected `{ seats: [...] }`.

## Cars / Travel-by-car
- POST `/travel/add-a-car` — Add car listing; Body car metadata.
- GET `/travel/get-a-car/<id>` — Single car detail.
- GET `/travel/get-all-car` — All car listings.
- GET `/travel/filter-car/by-query?<field>=<value>` — Filter cars by field.
- GET `/travel/get-seat-data/by-id/<id>` — Seat layout for given car/trip.
- POST `/travel/create-travel/booking` — Book seats; Body booking info; success toast on completion.
- POST `/travel/get-bookings-by/bookedBy` — Body `{ customerMobile }`; returns bookings for that phone number.

## Partner (Hotel) Onboarding
- POST `/hotel/partner` (see `partnerSlice.js`) — Partner registration form (multipart). Returns status + saved payload.
- POST `/hotel/partner/policies` — Save hotel policies for partner draft.
- POST `/hotel/partner/amenities` — Save amenities selection.
- POST `/hotel/partner/foods` — Save food options.
- POST `/hotel/partner/rooms` — Save room details for partner property.

## Reviews & Ratings
- GET `/getReviews/hotelId?hotelId=<id>` — Fetch reviews (reused in review slice; response array/object).

## Generic CRUD (admin-oriented)
Available via `src/services/api.js` for extensibility; all use `/api/...` prefix and return `response.data`:
- Rooms: `GET /api/rooms`, `GET /api/rooms/:id`, `POST /api/rooms`, `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`, `GET /api/rooms/search` with query params.
- Bookings: `POST /api/bookings`, `GET /api/bookings/user`, `GET /api/bookings/:id`, `PUT /api/bookings/:id`, `DELETE /api/bookings/:id`.
- User profile: `GET /api/users/profile`, `PUT /api/users/profile`, `POST /api/users/profile/picture`, `PUT /api/users/password`.
- Custom passthrough: `customAPI.get/post/put/delete/patch(endpoint, ...)` for any backend path; returns `response.data`.

## Response Envelope Patterns (as used in UI)
- Most slices call `response.data` directly; when backend nests, helpers normalize to `response.data.data` (see `normalizeResponse` in `bookingSlice.js`).
- Booking filters keep full envelope `{ success, data, html, pagination }` for table rendering.
- Tour seat map expects `{ seats: [] }`.
- Car bookings list expects `{ data: [...] }` under `response.data`.

## Error & Auth Handling
- 401 responses trigger `localStorage.authToken` removal and optional message from interceptor.
- Network/5xx errors set server status flag (used by `ApiInterceptorWrapper` + `ServerErrorPage`).
- Loader visibility is toggled automatically around each request via interceptor callbacks.

## Payment Hooks (Razorpay-style)
- `POST /create-order` returns an order payload used to open Razorpay in `bookingService.js` (amount, currency, orderId). Frontend adds `userId`, `hotelId`, `amount` before paying.

## Using This Doc in Another Frontend
1) Point your axios/fetch base to `https://hotelroomsstay.com/api`.
2) Reuse Authorization header with stored `authToken` when hitting protected endpoints.
3) Preserve query param names exactly (e.g., `search`, `checkInDate`, `countRooms`).
4) Expect mixed envelopes: some endpoints return `{ data: ... }`, others return raw arrays/objects; normalize like this project does.
5) Long-running booking endpoints may need higher timeouts (>30s for `/booking/...` and payments).

