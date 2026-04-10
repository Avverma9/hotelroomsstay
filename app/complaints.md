# Complaints API — User Side

Base URL: `hotelroomsstay.com/api`

Sab complaint routes directly root `/` pe mounted hain.

---

## Endpoints Overview

| Method | Endpoint | Kya karta hai |
|---|---|---|
| `POST` | `/create-a-complaint/on/hotel` | Naya complaint create karo |
| `GET` | `/complaints/:userId` | User ke saare complaints + chats |
| `GET` | `/complaint/by-id/:id` | Single complaint detail |
| `POST` | `/do/chat-support/:complaintId` | Chat message bhejo |
| `DELETE` | `/delete-a-particular/complaints/delete/by/id/:id` | Complaint delete karo |

---

## 1. Complaint Create

**Method:** `POST`

**Endpoint:** `/create-a-complaint/on/hotel`

**Content-Type:** `multipart/form-data`

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | String | ✅ | MongoDB `_id` ya numeric `userId` dono chalate hain |
| `hotelId` | String | ✅ | Hotel ka MongoDB `_id` |
| `regarding` | String | ✅ | Niche enum values mein se ek |
| `issue` | String | ✅ | Problem description |
| `hotelName` | String | ❌ | |
| `hotelEmail` | String | ❌ | |
| `bookingId` | String | ❌ | Booking reference |
| `images` | File[] | ❌ | Multiple images attach kar sakte ho |

**`regarding` allowed values:**
```
Booking | Hotel | Website | Service | Staff | Cleanliness | Food | Billing | Room | Other
```

**Example (form-data):**
```
userId       = 67abc1234567890def123456
hotelId      = 664f1a2b3c4d5e6f7a8b9c0d
regarding    = Room
issue        = AC kaam nahi kar raha tha poori raat
hotelName    = Hotel Sunrise
hotelEmail   = sunrise@hotel.com
bookingId    = BK-20260401
images       = [file1.jpg, file2.jpg]
```

**Success Response `201`:**
```json
{
  "_id": "complaint_objectid",
  "complaintId": "45781236",
  "userId": "67abc1234567890def123456",
  "hotelId": "664f1a2b3c4d5e6f7a8b9c0d",
  "regarding": "Room",
  "issue": "AC kaam nahi kar raha tha poori raat",
  "hotelName": "Hotel Sunrise",
  "hotelEmail": "sunrise@hotel.com",
  "bookingId": "BK-20260401",
  "images": ["https://cdn.example.com/complaint1.jpg"],
  "status": "Pending",
  "updatedBy": [],
  "createdAt": "2026-04-06T10:00:00.000Z",
  "updatedAt": "2026-04-06T10:00:00.000Z"
}
```

> Ek user ke **3 se zyada Pending** complaints nahi ho sakti — us case mein `400` error aayega.

**Error Responses:**
```json
{ "message": "Missing required fields." }
{ "message": "User not found." }
{ "message": "You have too many pending complaints. Please resolve them before creating a new one." }
```

---

## 2. My Complaints (User ke saare)

**Method:** `GET`

**Endpoint:** `/complaints/:userId`

`:userId` = MongoDB `_id` ya numeric `userId` — dono chalate hain.

**Example:**
```
GET hotelroomsstay.com/api/complaints/67abc1234567890def123456
```

**Success Response `200`:**

Har complaint ke saath uske saare `chats` bhi aate hain:

```json
[
  {
    "_id": "complaint_objectid",
    "complaintId": "45781236",
    "userId": "67abc1234567890def123456",
    "hotelId": "664f1a2b3c4d5e6f7a8b9c0d",
    "regarding": "Room",
    "issue": "AC kaam nahi kar raha tha",
    "hotelName": "Hotel Sunrise",
    "status": "Pending",
    "images": [],
    "updatedBy": [],
    "createdAt": "2026-04-06T10:00:00.000Z",
    "updatedAt": "2026-04-06T10:00:00.000Z",
    "chats": [
      {
        "_id": "chat_objectid",
        "complaintId": "45781236",
        "sender": "user_id_or_name",
        "receiver": "support_id_or_name",
        "content": "Kab tak theek hoga?",
        "timestamp": "2026-04-06T11:00:00.000Z"
      }
    ]
  }
]
```

**Error Responses:**
```json
{ "message": "No complaints found for this user." }
```

---

## 3. Single Complaint Detail

**Method:** `GET`

**Endpoint:** `/complaint/by-id/:id`

`:id` = Complaint ka MongoDB `_id`

**Example:**
```
GET hotelroomsstay.com/api/complaint/by-id/complaint_objectid
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "complaint_objectid",
    "complaintId": "45781236",
    "userId": "67abc1234567890def123456",
    "hotelId": "664f1a2b3c4d5e6f7a8b9c0d",
    "regarding": "Room",
    "issue": "AC kaam nahi kar raha tha",
    "hotelName": "Hotel Sunrise",
    "status": "Working",
    "images": ["https://cdn.example.com/complaint1.jpg"],
    "updatedBy": [
      {
        "name": "Support Agent",
        "email": "support@hotelroomsstay.com",
        "status": "Working",
        "feedBack": "Team ko assign kar diya hai",
        "updatedAt": "2026-04-06T12:00:00.000Z"
      }
    ],
    "createdAt": "2026-04-06T10:00:00.000Z",
    "updatedAt": "2026-04-06T12:00:00.000Z",
    "chats": [
      {
        "_id": "chat_objectid",
        "complaintId": "45781236",
        "sender": "user_id_or_name",
        "receiver": "support_id_or_name",
        "content": "Kab tak theek hoga?",
        "timestamp": "2026-04-06T11:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
```json
{ "success": false, "message": "Complaint not found" }
```

---

## 4. Chat Message Bhejo

**Method:** `POST`

**Endpoint:** `/do/chat-support/:complaintId`

`:complaintId` = **`complaintId` field** (8-digit string jaise `"45781236"`) — MongoDB `_id` nahi.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "sender": "user_id_or_display_name",
  "receiver": "support_agent_id_or_name",
  "content": "Mera AC abhi bhi kharab hai, please jaldi dekhein"
}
```

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `sender` | ✅ | Jo bhej raha hai uska ID ya naam |
| `receiver` | ✅ | Jisko bhej raha hai |
| `content` | ✅ | Message text |

**Success Response `201`:**
```json
{
  "_id": "chat_objectid",
  "complaintId": "45781236",
  "sender": "user_id_or_display_name",
  "receiver": "support_agent_id_or_name",
  "content": "Mera AC abhi bhi kharab hai, please jaldi dekhein",
  "timestamp": "2026-04-06T13:30:00.000Z"
}
```

**Error Responses:**
```json
{ "message": "Missing required fields for chat." }
```

---

## 5. Complaint Delete

**Method:** `DELETE`

**Endpoint:** `/delete-a-particular/complaints/delete/by/id/:id`

`:id` = Complaint ka MongoDB `_id`

Complaint delete hone ke saath uske saare chats bhi delete ho jaate hain.

**Example:**
```
DELETE hotelroomsstay.com/api/delete-a-particular/complaints/delete/by/id/complaint_objectid
```

**Success Response `200`:**
```json
{
  "message": "Complaint and related chats deleted successfully",
  "deletedComplaint": { /* deleted complaint object */ },
  "deletedChatsCount": 4
}
```

**Error Responses:**
```json
{ "message": "Complaint not found" }
```

---

## Complaint Status Values

| Status | Matlab |
|---|---|
| `Pending` | Naya complaint — koi action nahi hua abhi |
| `Working` | Team investigation me hai |
| `Approved` | Complaint valid maana gaya |
| `Resolved` | Problem solve ho gayi |
| `Rejected` | Complaint invalid ya duplicate |

---

## Important Notes

1. `complaintId` (8-digit string) aur `_id` (MongoDB ObjectId) alag hain — chat ke liye `complaintId` chahiye, baaki routes mein `_id`
2. Ek user 3 se zyada `Pending` complaints nahi rakh sakta
3. Har `GET` response mein `chats` array automatically jodi jaati hai
4. Images S3 pe upload hoti hain — `multipart/form-data` zaroor use karo
