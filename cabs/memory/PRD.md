# TravelGo — Travel Car Booking Mobile App

## Overview
A React Native Expo mobile app (rider panel) consuming the external Travel Car & Booking API
at `https://hotelroomsstay.com/api/travel`. Users can sign up, search cars by route/date, view
car details, pick seats for shared rides, and confirm bookings with cash-on-pickup payment.

## Stack
- **Frontend:** React Native + Expo SDK 54, Expo Router (file-based), TypeScript
- **Backend:** FastAPI + MongoDB (used only for JWT auth)
- **Auth:** Custom JWT (email + password) with bcrypt. Token stored via expo-secure-store (web fallback: localStorage)
- **Storage:** expo-secure-store on native, localStorage on web
- **External API:** Called directly from app — no proxy

## User Choices
- Rider panel only (no owner/admin side)
- Custom JWT email+password auth
- Cash/Offline payment only (`paymentMethod=Cash`, `isPaid=true`, `confirmOnCreate=true`)
- Vibrant "Sunset Coral + Midnight Navy" theme

## Auth Endpoints (local `/api/auth`)
- `POST /api/auth/register` → `{ email, password, name, mobile }` → `{ token, user }`
- `POST /api/auth/login` → `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` → requires `Authorization: Bearer <token>`

## Screens (expo-router)
- `/` — auth check redirect
- `/(auth)/login` — Login
- `/(auth)/signup` — Register
- `/(tabs)/index` — Search (home) with pickup/drop/date + popular rides carousel
- `/(tabs)/bookings` — My bookings (pull-to-refresh)
- `/(tabs)/profile` — Profile with logout
- `/cars` — Listing (filtered or all)
- `/cars/[id]` — Car detail (image carousel, specs, route, CTA)
- `/cars/[id]/seats` — Visual seat picker (Shared cars)
- `/booking/confirm` — Passenger details + fare + cash pay CTA
- `/booking/[id]` — Booking detail with pickup/drop codes

## External API Used
- `GET /travel/get-all-car` — popular rides
- `GET /travel/filter-car/by-query` — search results
- `GET /travel/get-a-car/:id` — car detail
- `GET /travel/get-seat-data/by-id/:id` — seat layout for shared
- `POST /travel/create-travel/booking` — create booking (Cash, confirmOnCreate)
- `GET /travel/get-bookings-by/user/:userId` — my bookings
- `POST /travel/get-bookings-by/bookedBy` — fallback by mobile

## Key Features
- JWT auth with secure token persistence (bcrypt + 30-day access token)
- Beautiful vibrant UI (Sunset Coral #FF5A5F + Midnight Navy #0A1128)
- Visual seat picker with available / selected / booked states
- Route timeline with pickup→drop dots, horizontal popular rides carousel
- Booking confirmation with pickup code & drop code display
- Empty states with contextual imagery
- Pull-to-refresh on bookings list
- Full `testID` coverage for automated testing

## Testing
- ✅ Backend auth: 12/12 pytest tests
- ✅ Frontend: Playwright e2e (login/signup, search, car detail, seat picker, bookings, profile)
- Test user: `test@example.com / test123` (see `/app/memory/test_credentials.md`)

## Known Limitations
- External API bookings may return 401 intermittently for fresh users (handled gracefully via empty state)
- Image arrays from external API are often empty — placeholder image is used
