Notification API Reference

Overview
- Two notification types in this project:
  - User notifications (sent to specific user IDs)
  - Global notifications (broadcast / site-wide)

Routes (mounted at root)

1) User notifications
- POST  /push-a-new-notification-to-the-panel/dashboard/user
  - Description: Push a notification to one or more users (creates a user notification record).
  - Request JSON (body):
    {
      "name": "Offer: 20% off",         // string, required
      "message": "Get 20% off on booking", // string, required
      "userIds": ["user1","user2"], // array of string OR use `userId` (single)
      "path": "/offers/20",            // optional, default: "/app/notifications"
      "eventType": "offer",           // optional
      "metadata": { "offerId": "OFF20" } // optional object
    }
  - Response (201): Created notification document
    {
      "_id": "...",
      "name": "Offer: 20% off",
      "path": "/offers/20",
      "message": "Get 20% off on booking",
      "eventType": "offer",
      "metadata": { "offerId": "OFF20" },
      "seenBy": { "user1": false, "user2": false },
      "userIds": ["user1","user2"],
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }

- GET   /fetch-all-new-notification-to-the-panel/dashboard/get/:userId
  - Description: Fetch all user-specific notifications where `userIds` contains :userId.
  - Response (200): array of notification objects. Each has an added `seen` boolean for the requested user.
    [
      {
        "_id": "...",
        "name": "...",
        "message": "...",
        "path": "...",
        "eventType": "...",
        "metadata": { ... },
        "userIds": ["user1"],
        "seenBy": { "user1": false },
        "createdAt": "...",
        "updatedAt": "...",
        "seen": false
      }
    ]

- GET   /app/notifications/user/:userId
  - Alias of the previous endpoint (same controller). Returns the same payload.

- PATCH /fetch-all-new-notification-to-the-panel/and-mark-seen/dashboard-user/notification/:notificationId/seen
  - Description: Mark a user-specific notification as seen. The controller reads `userId` from body or params.
  - Request: either URL param or body: `{ "userId": "user1" }` (body optional if URL supplies userId)
  - Response (200): updated notification document (new:true) or 404 if not found for that user.

- PATCH /app/notifications/:notificationId/seen/:userId
  - Alias route that also calls the same controller to mark seen.

- DELETE /find/all/by/list/of/user/for/notification/and-delete/user/:notificationId
  - Description: Delete a user notification by id.
  - Response (200): `{ "message": "deleted" }`


2) Global notifications
- POST  /push-a-new-notification-to-the-panel/dashboard
  - Description: Create a global (broadcast) notification record.
  - Request JSON (body):
    {
      "name": "Planned maintenance",
      "message": "Site down midnight",
      "path": "/status"
    }
  - Response (201): `{ "message": "Notification created successfully." }` (controller does not return the doc)

- GET   /push-a-new-notification-to-the-panel/dashboard/get/:userId
  - Description: Fetch all global notifications; controller annotates each with `seen` computed from `seenBy` map for the requested userId.
  - Response: array of global notification objects, each with `seen: true|false`.

- PATCH /fetch-all-new-notification-to-the-panel/and-mark-seen/dashboard/:userId/:notificationId/seen
  - Description: Mark a global notification as seen for a given user. Also adds `userId` into the notification's `userIds` set.
  - Response (200): `{ "message": "Notification updated successfully." }`

- POST  /seen/by/list/of/user/for/notification/userId
  - Description: Accepts `{ "userIds": ["id1","id2"] }` and returns user details (id, name, mobile) for those ids.
  - Response (200): `[ { "id": "..", "name": "...", "mobile": "..." } ]`

- GET   /find/all/by/list/of/user/for/notification
  - Description: Returns all user notifications and global notifications in one payload.
  - Response (200): `{ "User": [...], "Global": [...] }

- DELETE /find/all/by/list/of/user/for/notification/and-delete-global/:notificationId
  - Description: Delete a global notification by id
  - Response (200): `{ "message": "deleted" }`


Models (important fields)
- UserNotification (models/notification/user.js)
  - `name`: String (required)
  - `path`: String (default: "/app/notifications")
  - `message`: String (required)
  - `eventType`: String (default: "general")
  - `metadata`: Mixed (object)
  - `seenBy`: Map<String, Boolean> — per-user seen flag
  - `userIds`: [String] — recipient user ids
  - `createdAt`, `updatedAt`

- GlobalNotification (models/notification/global.js)
  - `name`, `path`, `message`
  - `seenBy`: Map<String, Boolean>
  - `userIds`: [ObjectId ref DashboardUser]
  - `createdAt`, `updatedAt`

Notes & usage
- To push a notification to a single user you can send `userId` instead of `userIds` (controller normalizes it).
- Several controllers in the app call `createUserNotificationSafe(...)` internally (see `controllers/notification/helpers.js`) — those are programmatic triggers (not HTTP endpoints).
- The `seenBy` field is a Map in the schema — but responses are plain objects when using `.lean()`.
- Global endpoints mark `seen` differently: global controller stores seen flags in the same `seenBy` map.

File location of routes & controllers (quick links)
- Routes: `routes/notification/user.js`, `routes/notification/global.js`
- Controllers: `controllers/notification/user.js`, `controllers/notification/global.js`
- Helpers: `controllers/notification/helpers.js`
- Models: `models/notification/user.js`, `models/notification/global.js`

-- End of reference

UI Specification
----------------

Purpose
- Provide a clear, consistent user interface for receiving, viewing and acting on notifications.
- Support quick awareness (badge + dropdown), transient alerts (toasts) and a full Notification Center (inbox).

Primary UI Components
- `NotificationBadge` (header)
  - Shows unread count badge.
  - Data: fetch `/app/notifications/user/:userId` and count items where `seen === false`.
  - Behavior: clicking opens `NotificationDropdown` or navigates to Notification Center.

- `NotificationDropdown` (compact list)
  - Shows 5–10 recent notifications, grouped by date (Today / Yesterday / Older).
  - Each item shows `name`, short `message` (truncate), `eventType` tag, and relative time.
  - Actions on each item:
    - Click item: navigate to `path` (if present) and mark as seen (PATCH `/app/notifications/:notificationId/seen/:userId`).
    - Mark-as-read button: PATCH to same endpoint (optimistic UI update).

- `Toast` (optional transient)
  - For critical alerts (offers, booking updates) show a small toast with `name` + `message` and action button.
  - Auto-dismiss after 5–8s; provide undo for 3s if user dismisses incorrectly.

- `NotificationCenter` (full page)
  - Route: `/notifications` in frontend.
  - Data source: GET `/app/notifications/user/:userId` (server returns full list).
  - Features:
    - Pagination / infinite scroll for large lists.
    - Filters: `eventType`, date-range, read/unread.
    - Bulk actions: `Mark all as read` (client iterates PATCH per notification) and `Delete` (DELETE `/find/all/by/list/of/user/for/notification/and-delete/user/:notificationId`).
    - Search by text (client-side filter on `name` / `message` / `metadata`).

Admin UI
- Admin push form (Global): POST `/push-a-new-notification-to-the-panel/dashboard` with `{ name, message, path }`.
- Admin user-targeted push: POST `/push-a-new-notification-to-the-panel/dashboard/user` with `{ name, message, userIds }`.

Data mapping (what UI uses)
- `name` → title shown prominently.
- `message` → body / preview.
- `path` → navigation target when item clicked.
- `eventType` → badge / color (e.g., offer=green, alert=red, general=gray).
- `metadata` → optional (e.g., bookingId, offerId) for deep-linking.
- `createdAt` → display relative time and grouping.
- `seen` → computed by controllers from `seenBy[userId]`.

UX & Interaction Rules
- When user opens a notification item, call PATCH `/app/notifications/:notificationId/seen/:userId` to mark seen; update UI optimistically.
- For bulk `Mark all read`, perform PATCH requests in parallel and update local store only after successes; on failure retry with exponential backoff.
- For deletion, call the DELETE endpoint and remove item from UI only after success.
- Unauthenticated requests: UI must include Authorization header (JWT) and server must validate that `userId` matches token subject; do not trust client-supplied userId alone.

Performance & Real-time
- Polling: fallback to polling every 15–30s for new notifications.
- Preferred: integrate via WebSocket/SSE to push new notifications to connected clients (server-side hooks can call `createUserNotification` and emit socket events).

Accessibility
- Use semantic HTML lists and buttons.
- Provide ARIA role `menu` for dropdown and `alert` for toasts.
- Ensure keyboard navigation (Tab, Arrow keys) and visible focus states.
- Provide sufficient color contrast for `eventType` tags and badges.

Mobile
- Compact header badge; open Notification Center as full-screen modal or bottom sheet.
- Infinite scroll is preferred over pagination on mobile.

Error handling & UX
- Show inline error toast on API failures (e.g., "Failed to mark as read — retry").
- Use optimistic UI updates for responsiveness, but revert if server responds with error.

Sample React usage (pseudo)
```jsx
// fetch notifications and compute unread count
useEffect(() => {
  const res = await fetch(`/app/notifications/user/${userId}`);
  const items = await res.json();
  setNotifications(items);
  setUnreadCount(items.filter(i => !i.seen).length);
}, []);

async function markSeen(notificationId) {
  // optimistic
  setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, seen: true } : n));
  await fetch(`/app/notifications/${notificationId}/seen/${userId}`, { method: 'PATCH' });
}
```

API Examples (cURL)
- Push user notification
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"Offer","message":"20% off","userIds":["user1"]}' https://api.example.com/push-a-new-notification-to-the-panel/dashboard/user
```

- Get notifications for user
```bash
curl https://api.example.com/app/notifications/user/user1
```

- Mark as seen
```bash
curl -X PATCH https://api.example.com/app/notifications/<notificationId>/seen/user1
```

Security & privacy
- Only include the authenticated user's ID in client requests, and validate on server.
- Do not store sensitive data in `metadata` unless encrypted.

Next steps
- Add example UI screenshots / Figma spec (if you want I can draft simple mockups).
- Add Postman collection for these endpoints.

