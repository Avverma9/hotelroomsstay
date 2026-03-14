# Frontend Sidebar Management Guide

## Base URL
`http://localhost:5000`

## Goal
Frontend ko do cheezein handle karni hain:

1. Global sidebar links manage karna
2. Dashboard user ke liye sidebar access manage karna

Current backend me sidebar system `SidebarLink` + `dashboardUser.sidebarPermissions` par based hai.

## Concepts

### 1. Global Sidebar Links
Ye master menu items hote hain. Inme yeh fields hoti hain:

- `parentLink`
- `childLink`
- `route`
- `icon`
- `status`
- `role`
- `order`
- `isParentOnly`

### 2. User-Specific Access
Har dashboard user ke paas optional custom permission config hoti hai:

```json
{
  "mode": "role_based",
  "allowedLinkIds": [],
  "blockedLinkIds": []
}
```

### 3. Effective Sidebar
Final visible sidebar is logic se banta hai:

- `role_based`: role ke active links + `allowedLinkIds` - `blockedLinkIds`
- `custom`: sirf `allowedLinkIds` - `blockedLinkIds`

## Frontend Screens

### 1. Sidebar Master Screen
Use for:

- all sidebar links list
- create new menu item
- edit menu item
- active/inactive toggle
- delete menu item

### 2. User Permission Screen
Use for:

- specific dashboard user ki current permissions dekhna
- extra links allow karna
- specific links block karna
- final visible sidebar preview karna

## API Summary

### Global Sidebar Links

#### Get all links
- Method: `GET`
- URL: `/additional/sidebar-links`

Optional query params:

- `role=Developer`
- `status=active`

Example:
```http
GET /additional/sidebar-links?status=active
```

Response:
```json
{
  "message": "Sidebar links fetched successfully",
  "data": [
    {
      "_id": "69a94f0f374780f521919c93",
      "parentLink": "General",
      "childLink": "/dashboard",
      "isParentOnly": false,
      "icon": "MdDashboard",
      "status": "active",
      "role": ["Admin", "Developer"],
      "order": 1
    }
  ]
}
```

#### Get grouped links
- Method: `GET`
- URL: `/additional/sidebar-links/grouped`

Example:
```http
GET /additional/sidebar-links/grouped?role=Developer
```

Response:
```json
{
  "message": "Sidebar links grouped by parentLink",
  "data": {
    "General": [
      {
        "id": "69a94f0f374780f521919c93",
        "childLink": "/dashboard",
        "route": "/dashboard",
        "isParentOnly": false,
        "icon": "MdDashboard",
        "status": "active",
        "role": ["Admin", "Developer"],
        "order": 1
      }
    ]
  }
}
```

#### Create single link
- Method: `POST`
- URL: `/additional/sidebar-links`

Request:
```json
{
  "parentLink": "General",
  "childLink": "/dashboard",
  "icon": "MdDashboard",
  "status": "active",
  "role": ["Admin", "Developer"],
  "order": 1,
  "isParentOnly": false
}
```

Response:
```json
{
  "message": "Sidebar link created successfully",
  "data": {
    "_id": "69a94f0f374780f521919c93",
    "parentLink": "General",
    "childLink": "/dashboard",
    "isParentOnly": false,
    "icon": "MdDashboard",
    "status": "active",
    "role": ["Admin", "Developer"],
    "order": 1
  }
}
```

#### Create links in bulk
- Method: `POST`
- URL: `/additional/sidebar-links/bulk`

Request:
```json
[
  {
    "parentLink": "General",
    "childLink": "/dashboard",
    "icon": "MdDashboard",
    "status": "active",
    "role": ["Admin", "Developer"],
    "order": 1
  },
  {
    "parentLink": "General",
    "childLink": "/user",
    "icon": "MdPerson",
    "status": "active",
    "role": ["Admin", "Developer"],
    "order": 2
  }
]
```

#### Update link
- Method: `PUT`
- URL: `/additional/sidebar-links/:id`

Request:
```json
{
  "parentLink": "General",
  "childLink": "/dashboard-home",
  "icon": "MdDashboard",
  "status": "active",
  "role": ["Admin", "Developer", "PMS"],
  "order": 1,
  "isParentOnly": false
}
```

Response:
```json
{
  "message": "Sidebar link updated successfully",
  "data": {
    "_id": "69a94f0f374780f521919c93",
    "parentLink": "General",
    "childLink": "/dashboard-home",
    "isParentOnly": false,
    "icon": "MdDashboard",
    "status": "active",
    "role": ["Admin", "Developer", "PMS"],
    "order": 1
  }
}
```

#### Change status
- Method: `PATCH`
- URL: `/additional/sidebar-links/:id/status`

Request:
```json
{
  "status": "inactive"
}
```

Response:
```json
{
  "message": "Sidebar link status changed to inactive",
  "data": {
    "_id": "69a94f0f374780f521919c93",
    "status": "inactive"
  }
}
```

#### Delete link
- Method: `DELETE`
- URL: `/additional/sidebar-links/:id`

Response:
```json
{
  "message": "Sidebar link deleted successfully"
}
```

## User-Specific Permission APIs

#### Get current permission config
- Method: `GET`
- URL: `/additional/sidebar-permissions/:userId`

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

#### Update full permission config
- Method: `PUT`
- URL: `/additional/sidebar-permissions/:userId`

Request:
```json
{
  "mode": "role_based",
  "allowedLinkIds": ["69a94f0f374780f521919cb7"],
  "blockedLinkIds": ["69a94f0f374780f521919c96"]
}
```

Response:
```json
{
  "message": "User sidebar permissions updated",
  "data": {
    "userId": "66751804def0b0b1d2f0d672",
    "role": "Developer",
    "sidebarPermissions": {
      "mode": "role_based",
      "allowedLinkIds": ["69a94f0f374780f521919cb7"],
      "blockedLinkIds": ["69a94f0f374780f521919c96"]
    }
  }
}
```

Important:

- `PUT` full replace hai
- save karte time complete arrays bhejni hain
- partial payload bhejne par missing array empty ho jayegi

#### Get final visible sidebar for user
- Method: `GET`
- URL: `/additional/sidebar-links/for-user/:userId?grouped=true`

Response:
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
        "role": ["Admin", "Developer"],
        "order": 1
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

## Login-Based Sidebar Loading

Dashboard login endpoint:

- `POST /login/dashboard/user`

Response me `sidebarLinks` already milta hai:

```json
{
  "message": "Logged in as",
  "loggedUserRole": "Developer",
  "loggedUserId": "66751804def0b0b1d2f0d672",
  "rsToken": "jwt-token",
  "sidebarLinks": {
    "General": [
      {
        "id": "69a94f0f374780f521919c93",
        "route": "/dashboard",
        "icon": "MdDashboard"
      }
    ]
  },
  "sessionData": {
    "token": "jwt-token",
    "user": {
      "id": "66751804def0b0b1d2f0d672",
      "role": "Developer"
    },
    "sidebarLinks": {
      "General": [
        {
          "id": "69a94f0f374780f521919c93",
          "route": "/dashboard",
          "icon": "MdDashboard"
        }
      ]
    }
  }
}
```

Frontend rule:

- sidebar render directly from `response.sidebarLinks`
- page refresh par latest sidebar chahiye ho to `/additional/sidebar-links/for-user/:userId` hit karo

## Recommended Frontend Flow

### A. Sidebar Master Page
1. `GET /additional/sidebar-links`
2. list render karo
3. create modal se `POST /additional/sidebar-links`
4. edit modal se `PUT /additional/sidebar-links/:id`
5. toggle se `PATCH /additional/sidebar-links/:id/status`
6. delete action se `DELETE /additional/sidebar-links/:id`

### B. User Permission Page
1. selected dashboard user id lo
2. `GET /additional/sidebar-links` se all links fetch karo
3. `GET /additional/sidebar-permissions/:userId` se current config fetch karo
4. UI me:
   - mode selector
   - allowed links multiselect
   - blocked links multiselect
5. save par `PUT /additional/sidebar-permissions/:userId`
6. preview ke liye `GET /additional/sidebar-links/for-user/:userId`

### C. Dashboard App Login Flow
1. `POST /login/dashboard/user`
2. token store karo
3. `sessionData.user` store karo
4. `sidebarLinks` se sidebar render karo

## Suggested UI Mapping

### Sidebar Master Table Columns
- Parent
- Route
- Icon
- Roles
- Order
- Status
- Type
- Actions

### User Permission UI
- User info card
- Mode toggle: `role_based` / `custom`
- All links list with checkbox
- Block list selector
- Preview panel

## Validation Rules for Frontend

- `parentLink` required hai
- `role` array required hai
- non-parent-only item me `childLink` ya `route` required hai
- status only `active` ya `inactive`
- permission save me full arrays bhejo

## Common Mistakes

- sirf changed ids bhejna in `PUT /additional/sidebar-permissions/:userId`
- `role` ko string ki jagah empty array bhejna
- `childLink` missing bhejna for non-parent-only links
- login response ke badle alag sidebar fetch par depend karna unnecessarily

## Recommended Sequence for Implementation

1. Sidebar master page complete karo
2. User permission page complete karo
3. Login se sidebar hydration add karo
4. Preview sync add karo
5. Error states handle karo

