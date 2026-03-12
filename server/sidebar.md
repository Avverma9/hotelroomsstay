# Sidebar Copilot Guide

Yeh guide frontend developer ya Copilot ko batane ke liye hai ki dynamic sidebar backend se kaise aata hai, kaise render karna hai, parent link kaise banta hai, child links kaise add hote hain, aur per-user permissions kaise apply hoti hain.

## 1) Sidebar System Ka Goal

Sidebar hardcoded nahi hai. Backend se dynamic menu items aate hain.

Har sidebar item ke core fields:

```json
{
  "_id": "67c80e44170bb367bdf95c17",
  "parentLink": "Bookings",
  "childLink": "/dashboard/bookings",
  "isParentOnly": false,
  "icon": "MdOutlineHotel",
  "status": "active",
  "role": ["Admin", "PMS"],
  "order": 1
}
```

## 2) Sidebar Data Model Samjho

### `parentLink`

- Sidebar group/section ka naam
- Example: `General`, `Bookings`, `Tours`, `Admin Features`

### `childLink`

- Actual page route
- Example: `/dashboard`, `/tour-list`, `/admin-tour/bookings`

### `isParentOnly`

- `true` ho to item sirf parent heading ya collapsible section jaisa behave kar sakta hai
- `false` ho to item normal clickable menu item hai

### `icon`

- Icon name string
- Frontend me icon mapping object se resolve karna hai

### `status`

- `active` ya `inactive`
- Frontend ko sirf active items dikhane chahiye

### `role`

- Kaunse roles ke liye item allowed hai
- Example: `["Admin", "Developer", "PMS"]`

### `order`

- Render order control karta hai
- Smaller number pehle render hoga

## 3) Parent Link Kaise Banta Hai

Backend me alag parent table nahi hai. `parentLink` string hi grouping key hai.

Example:

```json
[
  {
    "parentLink": "Tours",
    "childLink": "/add-tour-data",
    "isParentOnly": false,
    "icon": "AirportShuttleRoundedIcon",
    "order": 13
  },
  {
    "parentLink": "Tours",
    "childLink": "/my-tour",
    "isParentOnly": false,
    "icon": "TourIcon",
    "order": 14
  },
  {
    "parentLink": "Tours",
    "childLink": "/tour-bookings",
    "isParentOnly": false,
    "icon": "LocalActivityIcon",
    "order": 15
  }
]
```

Is case me frontend sidebar me ek parent section banega:

- `Tours`

Aur uske andar 3 child menu items render honge.

## 4) Parent-Only Link Kaise Kaam Karta Hai

Agar create/update payload me:

```json
{
  "parentLink": "Reports",
  "isParentOnly": true,
  "icon": "MdAssessment",
  "status": "active",
  "role": ["Admin"],
  "order": 20
}
```

to backend internally `childLink` ko `"#"` set kar deta hai.

Matlab:

- item section header ho sakta hai
- ya non-clickable parent heading ho sakta hai

Frontend rule:

- agar `isParentOnly === true`
- aur `childLink === "#"`
- to us item ko non-clickable render karo

## 5) Child Link Kaise Add Hoga

### Single child link create karne ke liye

- Method: `POST`
- URL: `/additional/sidebar-links`

Request:

```json
{
  "parentLink": "Tours",
  "childLink": "/tour-list",
  "isParentOnly": false,
  "icon": "TourIcon",
  "status": "active",
  "role": ["Admin", "Developer", "TMS"],
  "order": 36
}
```

Alternative:

```json
{
  "parentLink": "Tours",
  "route": "/tour-list",
  "isParentOnly": false,
  "icon": "TourIcon",
  "status": "active",
  "role": ["Admin", "Developer", "TMS"],
  "order": 36
}
```

Backend `route` ko `childLink` me save kar dega.

## 6) Sidebar Render Karne Ka Best API

Frontend ko sidebar render karne ke liye best API ye hai:

- `GET /additional/sidebar-links/for-user/:userId`

Default response grouped hota hai, jo sidebar ke liye best hai.

Example response:

```json
{
  "message": "Sidebar links fetched for user",
  "data": {
    "General": [
      {
        "id": "69a94f0f374780f521919c93",
        "childLink": "/dashboard",
        "route": "/dashboard",
        "isParentOnly": false,
        "icon": "MdDashboard",
        "status": "active",
        "role": ["Admin", "Developer", "PMS"],
        "order": 1
      }
    ],
    "Tours": [
      {
        "id": "69a94f0f374780f521919cb6",
        "childLink": "/tour-list",
        "route": "/tour-list",
        "isParentOnly": false,
        "icon": "TourIcon",
        "status": "active",
        "role": ["Admin", "Developer"],
        "order": 36
      },
      {
        "id": "69a94f0f374780f521919cb7",
        "childLink": "/tour-requests",
        "route": "/tour-requests",
        "isParentOnly": false,
        "icon": "AirplaneTicketIcon",
        "status": "active",
        "role": ["Admin", "Developer"],
        "order": 37
      }
    ]
  },
  "user": {
    "id": "66751804def0b0b1d2f0d672",
    "role": "Developer",
    "permissionMode": "role_based"
  }
}
```

## 7) Frontend Sidebar Render Rule

Copilot ke liye recommended rendering algorithm:

1. login response se `sessionData.user.id` lo
2. `GET /additional/sidebar-links/for-user/:userId` call karo
3. response ka `data` grouped object milega
4. object keys ko parent section title ke roop me render karo
5. har parent ke andar array items render karo
6. `isParentOnly === true` item ko non-clickable label ya collapsible header banao
7. `isParentOnly === false` item ko clickable nav item banao
8. `childLink` ya `route` ko actual route navigation ke liye use karo

## 8) Recommended Frontend Data Flow

### Login ke baad

Admin/dashboard login response me already `sidebarLinks` aa raha hai.

Matlab frontend ke paas do options hain:

### Option A. Direct login response use karo

Use when:

- login ke turant baad sidebar show karna hai

Source:

- `response.sidebarLinks`

### Option B. Fresh sidebar API call use karo

Use when:

- user permissions update ho sakti hain
- page refresh ke baad latest sidebar chahiye

Source:

- `GET /additional/sidebar-links/for-user/:userId`

Recommended:

- login par `sidebarLinks` use karo
- refresh ya settings change ke baad fresh API call karo

## 9) Parent + Child Rendering Example

Backend grouped response:

```json
{
  "Tours": [
    {
      "id": "1",
      "childLink": "/add-tour-data",
      "isParentOnly": false,
      "icon": "AirportShuttleRoundedIcon",
      "order": 13
    },
    {
      "id": "2",
      "childLink": "/my-tour",
      "isParentOnly": false,
      "icon": "TourIcon",
      "order": 14
    }
  ]
}
```

Frontend render conceptual output:

- Parent: `Tours`
- Child 1: `Add Tour`
- Child 2: `My Tour`

Note:

- Label backend me currently separate field ke रूप me nahi hai
- Abhi `childLink` se label derive karna padega ya frontend mapping rakhni padegi

Example mapping:

```js
const sidebarLabelMap = {
  "/add-tour-data": "Add Tour",
  "/my-tour": "My Tour",
  "/tour-bookings": "Tour Bookings",
  "/dashboard": "Dashboard"
};
```

## 10) Icon Render Kaise Kare

Backend icon string bhejta hai. Frontend me icon registry rakho.

Example:

```js
import { MdDashboard, MdPerson, MdHotel, MdSettings } from "react-icons/md";
import { RiMessengerLine, RiCoupon3Line } from "react-icons/ri";

const iconMap = {
  MdDashboard,
  MdPerson,
  MdHotel,
  MdSettings,
  RiMessengerLine,
  RiCoupon3Line
};

const IconComponent = iconMap[item.icon];
```

Fallback:

- agar icon na mile to default icon show karo

## 11) Sidebar Permissions Kaise Kaam Karte Hain

Dashboard user model me:

```json
{
  "sidebarPermissions": {
    "mode": "role_based",
    "allowedLinkIds": [],
    "blockedLinkIds": []
  }
}
```

### `role_based`

- system role ke basis par links uthata hai
- fir `blockedLinkIds` hata deta hai
- `allowedLinkIds` extra links add kar sakta hai

### `custom`

- sirf `allowedLinkIds` ke links aayenge
- fir `blockedLinkIds` unme se bhi remove kar sakta hai

## 12) User-Specific Sidebar Permission APIs

### Get current user permissions

- `GET /additional/sidebar-permissions/:userId`

Response:

```json
{
  "message": "User sidebar permissions fetched",
  "data": {
    "userId": "66751804def0b0b1d2f0d672",
    "name": "Ankit Verma",
    "email": "Av95766@gmail.com",
    "role": "Developer",
    "sidebarPermissions": {
      "mode": "role_based",
      "allowedLinkIds": [],
      "blockedLinkIds": []
    }
  }
}
```

### Replace full permission config

- Method: `PUT`
- URL: `/additional/sidebar-permissions/:userId`

Request:

```json
{
  "mode": "custom",
  "allowedLinkIds": [
    "69a94f0f374780f521919cb6",
    "69a94f0f374780f521919cb7"
  ],
  "blockedLinkIds": []
}
```

### Add allowed links

- Method: `PATCH`
- URL: `/additional/sidebar-permissions/:userId/allow`

Request:

```json
{
  "linkIds": [
    "69a94f0f374780f521919cb6",
    "69a94f0f374780f521919cb7"
  ]
}
```

### Add blocked links

- Method: `PATCH`
- URL: `/additional/sidebar-permissions/:userId/block`

Request:

```json
{
  "linkIds": [
    "69a94f0f374780f521919cb8"
  ]
}
```

## 13) Flat Sidebar List Kab Use Karni Hai

Ye API admin settings page ke liye useful hai:

- `GET /additional/sidebar-links`

Use cases:

- all links table
- edit/delete
- role/status filtering

Example:

- `GET /additional/sidebar-links?role=Developer&status=active`

## 14) Grouped Sidebar List Kab Use Karni Hai

Ye API preview ya grouped management ke liye useful hai:

- `GET /additional/sidebar-links/grouped?role=Developer`

Use cases:

- sidebar preview
- parent section wise UI

## 15) Create Parent Section and Then Add Children

Recommended workflow:

### Step 1. Parent-only section create karo

```json
{
  "parentLink": "Reports",
  "isParentOnly": true,
  "icon": "MdAssessment",
  "status": "active",
  "role": ["Admin", "Developer"],
  "order": 100
}
```

### Step 2. Same `parentLink` ke saath child items add karo

```json
{
  "parentLink": "Reports",
  "childLink": "/reports/sales",
  "isParentOnly": false,
  "icon": "MdBarChart",
  "status": "active",
  "role": ["Admin", "Developer"],
  "order": 101
}
```

```json
{
  "parentLink": "Reports",
  "childLink": "/reports/users",
  "isParentOnly": false,
  "icon": "MdPeople",
  "status": "active",
  "role": ["Admin", "Developer"],
  "order": 102
}
```

## 16) Copilot Prompt Rules

Agar Copilot ko sidebar build karwana hai to is logic ko follow karna chahiye:

- backend grouped sidebar ko source of truth maano
- `parentLink` ko section title banao
- `childLink` ko route banao
- `isParentOnly` ko non-clickable group/header banao
- `icon` ko icon-map se resolve karo
- `order` ke hisaab se stable render karo
- `sidebarLinks` login response me mile to initial state usse hydrate karo
- latest sidebar chahiye to `/additional/sidebar-links/for-user/:userId` call karo
- labels ko frontend route-label map ya custom transform se derive karo

## 17) Practical React Render Shape

Expected frontend state:

```js
{
  General: [
    {
      id: "69a94f0f374780f521919c93",
      childLink: "/dashboard",
      route: "/dashboard",
      isParentOnly: false,
      icon: "MdDashboard",
      status: "active",
      role: ["Admin", "Developer"],
      order: 1
    }
  ],
  Tours: [
    {
      id: "69a94f0f374780f521919cb6",
      childLink: "/tour-list",
      route: "/tour-list",
      isParentOnly: false,
      icon: "TourIcon",
      status: "active",
      role: ["Admin", "Developer"],
      order: 36
    }
  ]
}
```

Render:

- outer loop: parent sections
- inner loop: child links

## 18) Important Limitations

- Separate `label` field abhi model me nahi hai
- Parent section alag model nahi hai, string-based grouping hai
- Same `parentLink` spelling consistent rakhni hogi
- `isParentOnly` item aur real child items ek hi section me mix ho sakte hain
- agar duplicate order diya gaya to order predictable rahega but best practice unique order rakhna hai

## 19) Backend Reference

- `routes/additional/additional.js`
- `controllers/addtionalSettings/sidebarLinks.js`
- `controllers/addtionalSettings/sidebarPermissionService.js`
- `models/additionalSettings/sidebarLink.js`
- `models/dashboardUser.js`
