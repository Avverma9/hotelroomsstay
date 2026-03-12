# Tour Panel API Guide

Yeh guide frontend admin/panel ke liye hai jahan se `tour add` aur `tour update` karna hai.

## Base Notes

- Base server URL example: `http://localhost:5000`
- Create route: `POST /create-tour`
- Update route: `PATCH /update-tour/data/:id`
- Image update alag route se hota hai: `PATCH /update-tour-image/:id`
- Tour images create ke time upload hoti hain aur update ke time existing `update-tour/data/:id` route images replace nahi karta

## Supported Tour Fields

| Field | Type | Notes |
| --- | --- | --- |
| `travelAgencyName` | string | Agency/display name |
| `agencyId` | string | Panel/user/agency identifier |
| `agencyPhone` | string | Contact number |
| `agencyEmail` | string | Contact email |
| `isAccepted` | boolean | Default `false` |
| `country` | string | Country |
| `state` | string | State |
| `city` | string | City |
| `visitngPlaces` | string | Code me field name typo ke saath isi naam se hai |
| `themes` | string | Example: `Adventure`, `Family` |
| `price` | number | Base package price |
| `nights` | number | Total nights |
| `days` | number | Total days |
| `from` | date string | ISO format recommended |
| `to` | date string | ISO format recommended |
| `isCustomizable` | boolean | Default `false` |
| `amenities` | string[] | Array of strings |
| `inclusion` | string[] | Array of strings |
| `exclusion` | string[] | Array of strings |
| `termsAndConditions` | object | Key-value map |
| `dayWise` | object[] | `{ day, description }` |
| `starRating` | number | 1 to 5 |
| `vehicles` | object[] | Seat inventory data |

## 1) Add Tour

### Endpoint

- Method: `POST`
- URL: `/create-tour`
- Content-Type: `multipart/form-data`

### Frontend Rule

- Agar images bhej rahe ho to `FormData` use karo
- Arrays/objects ko `JSON.stringify(...)` karke bhejna safest hai
- Image field technically koi bhi naam ho sakta hai because backend `multer.any()` use kar raha hai, lekin frontend me standard field name `images` rakhna better hai

### Request Payload Example

`multipart/form-data` me text fields:

```json
{
  "travelAgencyName": "Himalayan Escape",
  "agencyId": "AGENCY-1001",
  "agencyPhone": "9876543210",
  "agencyEmail": "ops@himalayanescape.com",
  "country": "India",
  "state": "Himachal Pradesh",
  "city": "Manali",
  "visitngPlaces": "Manali, Solang Valley, Atal Tunnel",
  "themes": "Adventure",
  "price": 8999,
  "nights": 3,
  "days": 4,
  "from": "2026-04-10T00:00:00.000Z",
  "to": "2026-04-13T00:00:00.000Z",
  "isCustomizable": true,
  "amenities": "[\"Hotel Stay\",\"Breakfast\",\"Transport\"]",
  "inclusion": "[\"Sightseeing\",\"Pickup\",\"Dinner\"]",
  "exclusion": "[\"Flight\",\"Personal Expense\"]",
  "termsAndConditions": "{\"cancellation\":\"Non-refundable within 48 hours\",\"childPolicy\":\"Above 5 years chargeable\"}",
  "dayWise": "[{\"day\":1,\"description\":\"Arrival and local check-in\"},{\"day\":2,\"description\":\"Solang Valley sightseeing\"}]",
  "starRating": 4,
  "vehicles": "[{\"name\":\"Tempo Traveller\",\"vehicleNumber\":\"HP01AB1234\",\"totalSeats\":12,\"seaterType\":\"2x2\",\"seatConfig\":{\"rows\":6,\"left\":2,\"right\":2,\"aisle\":true},\"seatLayout\":[\"1A\",\"1B\",\"1C\",\"1D\"],\"bookedSeats\":[],\"pricePerSeat\":1500,\"isActive\":true}]"
}
```

Files:

- `images`: one or multiple image files

### cURL Example

```bash
curl --request POST 'http://localhost:5000/create-tour' \
  --form 'travelAgencyName=Himalayan Escape' \
  --form 'agencyId=AGENCY-1001' \
  --form 'agencyPhone=9876543210' \
  --form 'agencyEmail=ops@himalayanescape.com' \
  --form 'country=India' \
  --form 'state=Himachal Pradesh' \
  --form 'city=Manali' \
  --form 'visitngPlaces=Manali, Solang Valley, Atal Tunnel' \
  --form 'themes=Adventure' \
  --form 'price=8999' \
  --form 'nights=3' \
  --form 'days=4' \
  --form 'from=2026-04-10T00:00:00.000Z' \
  --form 'to=2026-04-13T00:00:00.000Z' \
  --form 'isCustomizable=true' \
  --form 'amenities=["Hotel Stay","Breakfast","Transport"]' \
  --form 'inclusion=["Sightseeing","Pickup","Dinner"]' \
  --form 'exclusion=["Flight","Personal Expense"]' \
  --form 'termsAndConditions={"cancellation":"Non-refundable within 48 hours","childPolicy":"Above 5 years chargeable"}' \
  --form 'dayWise=[{"day":1,"description":"Arrival and local check-in"},{"day":2,"description":"Solang Valley sightseeing"}]' \
  --form 'starRating=4' \
  --form 'vehicles=[{"name":"Tempo Traveller","vehicleNumber":"HP01AB1234","totalSeats":12,"seaterType":"2x2","seatConfig":{"rows":6,"left":2,"right":2,"aisle":true},"seatLayout":["1A","1B","1C","1D"],"bookedSeats":[],"pricePerSeat":1500,"isActive":true}]' \
  --form 'images=@/absolute/path/tour-1.jpg' \
  --form 'images=@/absolute/path/tour-2.jpg'
```

### Success Response Example

Status: `201 Created`

```json
{
  "success": true,
  "message": "Tour created successfully",
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "travelAgencyName": "Himalayan Escape",
    "agencyId": "AGENCY-1001",
    "agencyPhone": "9876543210",
    "agencyEmail": "ops@himalayanescape.com",
    "isAccepted": false,
    "country": "India",
    "state": "Himachal Pradesh",
    "city": "Manali",
    "visitngPlaces": "Manali, Solang Valley, Atal Tunnel",
    "themes": "Adventure",
    "price": 8999,
    "nights": 3,
    "days": 4,
    "from": "2026-04-10T00:00:00.000Z",
    "to": "2026-04-13T00:00:00.000Z",
    "isCustomizable": true,
    "amenities": ["Hotel Stay", "Breakfast", "Transport"],
    "inclusion": ["Sightseeing", "Pickup", "Dinner"],
    "exclusion": ["Flight", "Personal Expense"],
    "termsAndConditions": {
      "cancellation": "Non-refundable within 48 hours",
      "childPolicy": "Above 5 years chargeable"
    },
    "dayWise": [
      { "day": 1, "description": "Arrival and local check-in" },
      { "day": 2, "description": "Solang Valley sightseeing" }
    ],
    "starRating": 4,
    "images": [
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg",
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000001-tour-2.jpg"
    ],
    "vehicles": [
      {
        "_id": "67f1c9d2a12b34567890abce",
        "name": "Tempo Traveller",
        "vehicleNumber": "HP01AB1234",
        "totalSeats": 12,
        "seatConfig": {
          "rows": 6,
          "left": 2,
          "right": 2,
          "aisle": true
        },
        "seaterType": "2x2",
        "seatLayout": ["1A", "1B", "1C", "1D"],
        "bookedSeats": [],
        "pricePerSeat": 1500,
        "isActive": true
      }
    ],
    "createdAt": "2026-03-11T10:30:00.000Z",
    "updatedAt": "2026-03-11T10:30:00.000Z",
    "__v": 0
  }
}
```

### Error Response Example

Status: `500`

```json
{
  "success": false,
  "message": "Failed to create tour",
  "error": "Validation or upload error message"
}
```

## 2) Update Tour

### Endpoint

- Method: `PATCH`
- URL: `/update-tour/data/:id`
- Content-Type: `application/json`

Example:

- `PATCH /update-tour/data/67f1c9d2a12b34567890abcd`

### Frontend Rule

- Is route se normal tour data update hota hai
- Agar `amenities`, `inclusion`, `exclusion`, `dayWise`, `vehicles`, `termsAndConditions` bhej rahe ho to JSON object/array bhejna best hai
- Agar panel me `FormData` use karna pade bina files ke, tab in fields ko stringified JSON me bhejo
- Is route se images replace ya append nahi hongi

### Request Payload Example

```json
{
  "travelAgencyName": "Himalayan Escape Premium",
  "agencyPhone": "9876500000",
  "price": 9999,
  "nights": 4,
  "days": 5,
  "themes": "Adventure Premium",
  "isCustomizable": false,
  "amenities": ["Hotel Stay", "Breakfast", "Dinner", "Transport"],
  "inclusion": ["Sightseeing", "Pickup", "Dinner", "Camp Fire"],
  "exclusion": ["Flight", "Personal Expense", "Entry Tickets"],
  "termsAndConditions": {
    "cancellation": "50% refund before 5 days",
    "childPolicy": "Above 5 years chargeable"
  },
  "dayWise": [
    { "day": 1, "description": "Arrival and hotel check-in" },
    { "day": 2, "description": "Solang Valley and adventure activities" },
    { "day": 3, "description": "Atal Tunnel and local market visit" }
  ],
  "vehicles": [
    {
      "name": "Volvo Bus",
      "vehicleNumber": "HP02XY4567",
      "totalSeats": 20,
      "seaterType": "2x2",
      "seatConfig": {
        "rows": 10,
        "left": 2,
        "right": 2,
        "aisle": true
      },
      "seatLayout": ["1A", "1B", "1C", "1D", "2A", "2B", "2C", "2D"],
      "bookedSeats": [],
      "pricePerSeat": 1800,
      "isActive": true
    }
  ]
}
```

### Success Response Example

Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "travelAgencyName": "Himalayan Escape Premium",
    "agencyId": "AGENCY-1001",
    "agencyPhone": "9876500000",
    "agencyEmail": "ops@himalayanescape.com",
    "isAccepted": false,
    "country": "India",
    "state": "Himachal Pradesh",
    "city": "Manali",
    "visitngPlaces": "Manali, Solang Valley, Atal Tunnel",
    "themes": "Adventure Premium",
    "price": 9999,
    "nights": 4,
    "days": 5,
    "from": "2026-04-10T00:00:00.000Z",
    "to": "2026-04-13T00:00:00.000Z",
    "isCustomizable": false,
    "amenities": ["Hotel Stay", "Breakfast", "Dinner", "Transport"],
    "inclusion": ["Sightseeing", "Pickup", "Dinner", "Camp Fire"],
    "exclusion": ["Flight", "Personal Expense", "Entry Tickets"],
    "termsAndConditions": {
      "cancellation": "50% refund before 5 days",
      "childPolicy": "Above 5 years chargeable"
    },
    "dayWise": [
      { "day": 1, "description": "Arrival and hotel check-in" },
      { "day": 2, "description": "Solang Valley and adventure activities" },
      { "day": 3, "description": "Atal Tunnel and local market visit" }
    ],
    "starRating": 4,
    "images": [
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg",
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000001-tour-2.jpg"
    ],
    "vehicles": [
      {
        "_id": "67f1c9d2a12b34567890abcf",
        "name": "Volvo Bus",
        "vehicleNumber": "HP02XY4567",
        "totalSeats": 20,
        "seatConfig": {
          "rows": 10,
          "left": 2,
          "right": 2,
          "aisle": true
        },
        "seaterType": "2x2",
        "seatLayout": ["1A", "1B", "1C", "1D", "2A", "2B", "2C", "2D"],
        "bookedSeats": [],
        "pricePerSeat": 1800,
        "isActive": true
      }
    ],
    "createdAt": "2026-03-11T10:30:00.000Z",
    "updatedAt": "2026-03-11T11:00:00.000Z",
    "__v": 0
  }
}
```

### Not Found Response

Status: `404`

```json
{
  "success": false,
  "message": "Tour not found"
}
```

### Error Response

Status: `500`

```json
{
  "success": false,
  "message": "Failed to update tour",
  "error": "Validation or server error message"
}
```

## 3) Update Tour Images Separately

### Append New Images

- Method: `PATCH`
- URL: `/update-tour-image/:id`
- Content-Type: `multipart/form-data`

Frontend example:

- `images`: one or multiple files

Response shape:

```json
{
  "success": true,
  "data": {
    "_id": "67f1c9d2a12b34567890abcd",
    "images": [
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000000-tour-1.jpg",
      "https://your-bucket.s3.eu-north-1.amazonaws.com/1710150000500-tour-3.jpg"
    ]
  }
}
```

## Frontend Integration Notes

- Create panel me `FormData` use karo
- Update panel me plain JSON use karo
- `visitngPlaces` field ka backend name typo ke saath hi bhejna hai
- `termsAndConditions` backend me `Map` ban kar store hota hai, isliye object format best hai
- `vehicles.totalSeats`, `vehicles.seatConfig.rows`, `vehicles.seatConfig.left`, `vehicles.seatConfig.right`, `price`, `nights`, `days`, `starRating`, `pricePerSeat` numeric values honi chahiye
- `starRating` valid range `1` se `5` tak hai
- Images ko same update API me mat bhejo; uske liye dedicated image endpoint use karo

## Backend Reference

- Route definitions: `routes/tour/tour.js`
- Controller logic: `controllers/tour/tour.js`
- Schema: `models/tour/tour.js`
