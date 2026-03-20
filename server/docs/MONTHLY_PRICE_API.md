# Monthly Price API

**Base URL:** `http://localhost:5000`

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/monthly-set-room-price/:hotelId/:roomId` | Monthly price set karo |
| `GET` | `/monthly-set-room-price/get/by/:hotelId` | Hotel ki saari prices lo |
| `PATCH` | `/monthly-set-room-price/update/:id` | Price update karo |
| `DELETE` | `/monthly-set-room-price/delete/by-id/:id` | Single entry delete |
| `DELETE` | `/monthly-set-room-price/delete/price/by/:hotelId` | Hotel ki saari prices delete |

---

## POST `/monthly-set-room-price/:hotelId/:roomId`

**URL Params:** `hotelId`, `roomId`

**Request Body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `startDate` | String (ISO) | ✅ | `2026-04-01` |
| `endDate` | String (ISO) | ✅ | `2026-04-30` — must be after startDate |
| `monthPrice` | Number | ✅ | Non-negative |

```json
{
  "startDate": "2026-04-01",
  "endDate":   "2026-04-30",
  "monthPrice": 25000
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3...",
    "hotelId": "12345678",
    "roomId": "ROOM-001",
    "startDate": "2026-04-01",
    "endDate": "2026-04-30",
    "monthPrice": 25000
  }
}
```

---

## GET `/monthly-set-room-price/get/by/:hotelId`

**URL Param:** `hotelId`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3...",
      "hotelId": "12345678",
      "roomId": "ROOM-001",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "monthPrice": 25000,
      "roomType": "Deluxe",
      "roomBedType": "King"
    }
  ]
}
```

> `roomType` / `roomBedType` hotel ke room data se merge hoti hain. `null` agar room delete ho gaya ho.

---

## PATCH `/monthly-set-room-price/update/:id`

**URL Param:** `id` — MongoDB `_id` of price entry

**Request Body (all optional):**
```json
{
  "startDate": "2026-04-05",
  "endDate":   "2026-04-30",
  "monthPrice": 22000
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { ...updatedDocument }
}
```

---

## DELETE `/monthly-set-room-price/delete/by-id/:id`

Single entry delete by MongoDB `_id`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Deleted successfully",
  "data": { ...deletedDocument }
}
```

---

## DELETE `/monthly-set-room-price/delete/price/by/:hotelId`

Hotel ki **saari** monthly price entries delete karo.

**Response `200`:**
```json
{
  "success": true,
  "message": "Deleted 3 price entries for hotel 12345678"
}
```

---

## Error Responses

```json
// 400
{ "error": "startDate, endDate and monthPrice are required." }
{ "error": "endDate must be after startDate." }
{ "error": "monthPrice must be a non-negative number." }

// 404
{ "error": "Monthly price entry not found." }
{ "error": "No monthly price entries found for this hotel." }

// 500
{ "error": "Internal Server Error" }
```
