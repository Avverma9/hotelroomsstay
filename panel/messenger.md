# Messenger API Guide

## Overview

Messenger module 2 layers par kaam karta hai:

1. REST APIs for contacts, chat list, chat history, and sending messages
2. Socket events for realtime updates and online/offline presence

Frontend session storage se current user ka token aur user id uthata hai.

## Socket Server Endpoint

Current runtime behavior me socket connection ek hi jagah fully consistent nahi hai:

- ek flow app base URL use karta hai
- ek flow hardcoded hosted socket server use karta hai

Production integration ke liye recommended hai ki ek single socket base URL use kiya jaye.

## Auth

Har protected REST request me header bheja jaata hai:

```http
Authorization: <rs_token>
```

Note:

- Current messenger requests token ko raw value ki tarah bhejte hain.
- Agar backend `Bearer <token>` expect karta hai to backend ya frontend dono me consistency maintain karni hogi.

## Message Flow

### 1. Messenger open hone par

Jab messenger screen open hoti hai, frontend current logged-in user ke liye:

- contacts fetch karta hai
- recent chats fetch karta hai

Isse left sidebar me:

- `Contacts` tab me saved contacts
- `Chat` tab me recent conversation previews

## 2. Contact ya chat select karne par

Jab user kisi contact ya recent chat par click karta hai:

- selected receiver id set hoti hai
- receiver ki basic profile fetch hoti hai
- sender + receiver ke beech messages fetch hote hain

Chat header me receiver ka:

- name
- online status

show hota hai.

## 3. Message send karne par

Frontend multipart `FormData` banata hai:

- `senderId`
- `receiverId`
- `content`
- `timestamp`
- `seen`
- `images` repeated field for attachments

Phir:

1. REST API hit hoti hai
2. success ke baad socket event `newMessage` emit hota hai
3. receiver side realtime update dekh sakta hai

## 4. Incoming message receive hone par

Frontend socket se `newMessage` event sunta hai.
Jab message active receiver se related hota hai, woh current message list me append ho jaata hai.

## 5. Contact management

Contacts separately manage hote hain:

- contact add
- contact delete
- updated contacts dubara fetch

## 6. Presence flow

Socket connect hote hi frontend:

- `registerUser` emit karta hai
- `userStatus` emit karta hai with `isOnline: true`

Socket disconnect ya unmount par:

- `userStatus` emit karta hai with `isOnline: false`

---

## REST APIs

## 1. Get Chat Contacts

### Endpoint

```http
GET /chatApp/get-chat-contacts/:userId
```

### Purpose

Logged-in user ke saved contacts laane ke liye.

### Path Params

- `userId`: current logged-in user id

### Request Example

```http
GET /chatApp/get-chat-contacts/65f1c2ab12cd34ef56ab7890
Authorization: <rs_token>
```

### Response Shape Used By Frontend

Frontend specifically `contacts` array read karta hai:

```json
{
  "contacts": [
    {
      "_id": "contact-record-id",
      "userId": "65f1c2ab12cd34ef56ab1111",
      "name": "Rahul Sharma",
      "mobile": "9876543210",
      "role": "PMS",
      "images": "https://cdn.example.com/profile.jpg"
    }
  ]
}
```

### Important Fields

- `userId`: contact user id, isi ko receiver select karne me use kiya jaata hai
- `name`
- `mobile`
- `role`
- `images`

---

## 2. Add Contact

### Endpoint

```http
PATCH /chatApp/contacts/:userId
```

### Purpose

Current user ke contacts me ek naya user add karna.

### Path Params

- `userId`: current logged-in user id

### Request Body

```json
{
  "userId": "65f1c2ab12cd34ef56ab1111"
}
```

Yahan body wala `userId` matlab jis user ko contact list me add karna hai.

### Request Example

```http
PATCH /chatApp/contacts/65f1c2ab12cd34ef56ab7890
Authorization: <rs_token>
Content-Type: application/json

{
  "userId": "65f1c2ab12cd34ef56ab1111"
}
```

### Minimum Response Frontend Needs

Frontend response body read nahi karta, sirf successful HTTP status chahta hai.

Recommended response:

```json
{
  "message": "Contact added successfully",
  "contact": {
    "_id": "contact-record-id",
    "userId": "65f1c2ab12cd34ef56ab1111",
    "name": "Rahul Sharma",
    "mobile": "9876543210",
    "role": "PMS",
    "images": "https://cdn.example.com/profile.jpg"
  }
}
```

---

## 3. Delete Contact

### Endpoint

```http
DELETE /chatApp/contacts/:userId/:contactUserId
```

### Purpose

Current user ke contacts me se ek contact remove karna.

### Path Params

- `userId`: current logged-in user id
- `contactUserId`: jis contact ko remove karna hai uska user id

### Request Example

```http
DELETE /chatApp/contacts/65f1c2ab12cd34ef56ab7890/65f1c2ab12cd34ef56ab1111
Authorization: <rs_token>
```

### Minimum Response Frontend Needs

Frontend sirf successful status code par depend karta hai.

Recommended response:

```json
{
  "message": "Contact removed successfully"
}
```

---

## 4. Get Recent Chats

### Endpoint

```http
GET /chatApp/get-chats/:userId
```

### Purpose

Recent conversations ki sidebar list laane ke liye.

### Path Params

- `userId`: current logged-in user id

### Request Example

```http
GET /chatApp/get-chats/65f1c2ab12cd34ef56ab7890
Authorization: <rs_token>
```

### Response Shape Used By Frontend

Frontend directly array expect karta hai:

```json
[
  {
    "receiverId": "65f1c2ab12cd34ef56ab1111",
    "receiver": "65f1c2ab12cd34ef56ab1111",
    "name": "Rahul Sharma",
    "content": "Last message preview",
    "timestamp": "2026-03-13T10:15:30.000Z",
    "images": []
  }
]
```

### Important Fields

- `receiverId`: active chat select karne ke liye use hota hai
- `name`: sidebar label
- `content`: last message preview
- `timestamp`

---

## 5. Get Messages of a Chat

### Endpoint

```http
GET /chatApp/get-messages/of-chat/:userId1/:userId2
```

### Purpose

Do users ke beech full message history fetch karne ke liye.

### Path Params

- `userId1`: selected receiver id
- `userId2`: current logged-in sender id

### Request Example

```http
GET /chatApp/get-messages/of-chat/65f1c2ab12cd34ef56ab1111/65f1c2ab12cd34ef56ab7890
Authorization: <rs_token>
```

### Response Shape Used By Frontend

Frontend direct array use karta hai:

```json
[
  {
    "_id": "msg_001",
    "sender": "65f1c2ab12cd34ef56ab7890",
    "receiver": "65f1c2ab12cd34ef56ab1111",
    "content": "Hello",
    "images": [
      "https://cdn.example.com/messages/img1.jpg"
    ],
    "timestamp": "2026-03-13T10:20:00.000Z",
    "seen": false
  }
]
```

### Notes

- Frontend plain string ids aur Mongo extended JSON dono handle karta hai
- `sender` kabhi string ho sakta hai, kabhi `{ "$oid": "..." }`
- `timestamp` kabhi ISO string ho sakta hai, kabhi `{ "$date": "..." }`

Backend ke liye best rahega ki hamesha normalized plain JSON return kare.

---

## 6. Send Message

### Endpoint

```http
POST /chatApp/send-messages
```

### Purpose

Text aur image attachment ke saath message send karna.

### Content Type

```http
multipart/form-data
```

### FormData Fields

- `senderId`: current user id
- `receiverId`: selected receiver id
- `content`: text message
- `timestamp`: ISO datetime string
- `seen`: `false`
- `images`: one or multiple file entries

### Request Example

```http
POST /chatApp/send-messages
Authorization: <rs_token>
Content-Type: multipart/form-data
```

Form fields:

```text
senderId=65f1c2ab12cd34ef56ab7890
receiverId=65f1c2ab12cd34ef56ab1111
content=Hello from panel
timestamp=2026-03-13T10:25:00.000Z
seen=false
images=<file1>
images=<file2>
```

### Recommended Response

Frontend current response payload directly consume nahi karta, lekin best response ye hona chahiye:

```json
{
  "_id": "msg_002",
  "sender": "65f1c2ab12cd34ef56ab7890",
  "receiver": "65f1c2ab12cd34ef56ab1111",
  "content": "Hello from panel",
  "images": [
    "https://cdn.example.com/messages/msg_002_1.jpg",
    "https://cdn.example.com/messages/msg_002_2.jpg"
  ],
  "timestamp": "2026-03-13T10:25:00.000Z",
  "seen": false
}
```

### Important Runtime Note

Current frontend REST success ke baad socket `newMessage` bhi emit karta hai, lekin us socket emit me image URLs ke jagah local browser preview URLs bheje ja rahe hain. Isliye persistent source of truth REST API response hi hona chahiye.

---

## 7. Get Receiver Profile for Chat Header

### Endpoint

```http
GET /login/dashboard/get/all/user/:userId
```

### Purpose

Selected receiver ka name aur online status dikhane ke liye.

### Path Params

- `userId`: selected receiver id

### Response Shape Used By Frontend

```json
{
  "_id": "65f1c2ab12cd34ef56ab1111",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "mobile": "9876543210",
  "role": "PMS",
  "isOnline": true,
  "images": [
    "https://cdn.example.com/profile.jpg"
  ]
}
```

### Important Fields

- `name`
- `isOnline`
- `images`

---

## Socket Events

## 1. Register User

### Event

```text
registerUser
```

### Emitted Payload

```json
"65f1c2ab12cd34ef56ab7890"
```

### Purpose

Socket server ko batana ki current user kis socket connection se mapped hai.

---

## 2. User Status

### Event

```text
userStatus
```

### Emitted Payload

```json
{
  "senderId": "65f1c2ab12cd34ef56ab7890",
  "isOnline": true
}
```

Disconnect/unmount par:

```json
{
  "senderId": "65f1c2ab12cd34ef56ab7890",
  "isOnline": false
}
```

### Purpose

Presence update dena.

---

## 3. New Message

### Event

```text
newMessage
```

### Outgoing Payload From Frontend

```json
{
  "content": "Hello from panel",
  "images": [],
  "senderId": "65f1c2ab12cd34ef56ab7890",
  "receiverId": "65f1c2ab12cd34ef56ab1111",
  "timestamp": "2026-03-13T10:25:00.000Z"
}
```

### Incoming Payload Expected By Frontend

Frontend incoming event me broadly ye fields expect karta hai:

```json
{
  "_id": "msg_002",
  "sender": "65f1c2ab12cd34ef56ab7890",
  "receiver": "65f1c2ab12cd34ef56ab1111",
  "content": "Hello from panel",
  "images": [],
  "timestamp": "2026-03-13T10:25:00.000Z"
}
```

### Purpose

Realtime message append karna.

---

## 4. Message Deleted

### Event

```text
messageDeleted
```

### Incoming Payload

Likely deleted message id:

```json
"msg_002"
```

### Purpose

Future delete sync ke liye event already wired hai, lekin current frontend actively handle nahi karta.

---

## 5. User Status Update

### Event

```text
userStatusUpdate
```

### Incoming Payload

Likely shape:

```json
{
  "senderId": "65f1c2ab12cd34ef56ab1111",
  "isOnline": true
}
```

### Purpose

Realtime online/offline status update.

Current frontend listener registered hai, lekin payload ka visible UI update abhi fully implemented nahi hai.

---

## 6. Message Seen

### Event

```text
messageSeen
```

### Incoming Payload

Likely shape:

```json
{
  "messageId": "msg_002",
  "seen": true,
  "seenBy": "65f1c2ab12cd34ef56ab1111"
}
```

### Purpose

Seen/read status sync.

Current frontend event listener present hai, but UI update abhi implemented nahi hai.

---

## Recommended Stable Backend Contract

Messenger frontend ko reliably chalane ke liye backend ideally:

- ids plain strings me return kare
- timestamps ISO strings me return kare
- `contacts` API me wrapper object de: `{ "contacts": [...] }`
- `chats` aur `messages` APIs me arrays return kare
- `send-messages` par created message object return kare
- image attachments ke liye final public URLs return kare, local blob URLs nahi

## Summary

Messenger ka main operational contract ye hai:

- contacts list -> `GET /chatApp/get-chat-contacts/:userId`
- recent chats -> `GET /chatApp/get-chats/:userId`
- message history -> `GET /chatApp/get-messages/of-chat/:userId1/:userId2`
- send message -> `POST /chatApp/send-messages`
- add contact -> `PATCH /chatApp/contacts/:userId`
- remove contact -> `DELETE /chatApp/contacts/:userId/:contactUserId`
- receiver profile -> `GET /login/dashboard/get/all/user/:userId`
- realtime -> `registerUser`, `userStatus`, `newMessage`, `messageDeleted`, `userStatusUpdate`, `messageSeen`
