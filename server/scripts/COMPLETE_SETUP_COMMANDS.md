# Complete Complaint Routes Setup - MongoDB Commands

## Overview
This guide will add complaint sidebar links and ensure route permissions are properly configured to avoid "Access Denied" errors.

---

## Step 1: Add Sidebar Links

### Connect to MongoDB
```bash
mongosh "mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel"
```

### Insert Sidebar Links
```javascript
db.sidebarlinks.insertMany([
  {
    parentLink: "Complaints",
    childLink: "/file-complaint",
    label: "File Complaint",
    isParentOnly: false,
    icon: "FileText",
    status: "active",
    role: ["Admin", "Developer", "PMS", "TMS", "CA", "Rider"],
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    parentLink: "Complaints",
    childLink: "/complaint/user/create",
    label: "User Complaint",
    isParentOnly: false,
    icon: "User",
    status: "active",
    role: ["Admin", "Developer", "PMS", "TMS", "CA", "Rider"],
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    parentLink: "Complaints",
    childLink: "/complaint/admin/create",
    label: "Admin Complaint",
    isParentOnly: false,
    icon: "UserCog",
    status: "active",
    role: ["Admin", "Developer"],
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    parentLink: "Complaints",
    childLink: "/user-complaint",
    label: "All Complaints",
    isParentOnly: false,
    icon: "List",
    status: "active",
    role: ["Admin", "Developer", "PMS", "TMS", "CA", "Rider"],
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    parentLink: "Complaints",
    childLink: "/your-complaints",
    label: "Your Complaints",
    isParentOnly: false,
    icon: "MessageSquare",
    status: "active",
    role: ["Admin", "Developer", "PMS", "TMS", "CA", "Rider"],
    order: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

### Verify Sidebar Links
```javascript
db.sidebarlinks.find({ parentLink: "Complaints" }).sort({ order: 1 })
```

---

## Step 2: Check & Fix Route Permissions

### Check Users with Custom Route Permissions
```javascript
db.dashboardusers.find(
  { "routePermissions.mode": "custom" },
  { email: 1, role: 1, "routePermissions": 1 }
)
```

### Understanding Route Permission Modes

**Mode: "allow_all" (Default)**
- User can access ALL routes
- No "Access Denied" errors
- **Recommended for most users**

**Mode: "custom"**
- User can ONLY access routes in `allowedRoutes` array
- Will get "Access Denied" if route not listed
- Used for restricted access

### Fix Access Denied Issues

**Option A: Set User to allow_all Mode (Easiest)**
```javascript
// For a specific user
db.dashboardusers.updateOne(
  { email: "user@example.com" },
  { $set: { "routePermissions.mode": "allow_all" } }
)

// For ALL users (recommended)
db.dashboardusers.updateMany(
  {},
  { $set: { "routePermissions.mode": "allow_all" } }
)
```

**Option B: Add Complaint Routes to Custom Permissions**
```javascript
// For a specific user with custom permissions
db.dashboardusers.updateOne(
  { email: "user@example.com" },
  {
    $addToSet: {
      "routePermissions.allowedRoutes": {
        $each: [
          "/file-complaint",
          "/complaint/user/create",
          "/complaint/admin/create",
          "/user-complaint",
          "/your-complaints",
          "/complaint/chat/:id"
        ]
      }
    }
  }
)
```

### Verify Route Permissions
```javascript
// Check your own user
db.dashboardusers.findOne(
  { email: "YOUR_EMAIL" },
  { routePermissions: 1 }
)

// Expected output for allow_all:
{
  "routePermissions": {
    "mode": "allow_all",
    "allowedRoutes": [],
    "blockedRoutes": []
  }
}
```

---

## Step 3: Add Routes to Manage Menu (Panel)

The routes are already configured in `panel/src/routes/app-routes.jsx`. Make sure these exist:

```javascript
{ path: "/file-complaint", Component: FileComplaintSelection },
{ path: "/complaint/admin/create", Component: CreateAdminComplaint },
{ path: "/complaint/user/create", Component: CreateUserComplaint },
{ path: "/complaint/chat/:id", Component: ComplaintChat },
{ path: "/your-complaints", Component: MyComplaints },
{ path: "/user-complaint", Component: UserComplaintsPage },
```

✅ Already added in our implementation!

---

## Complete Setup Checklist

### Database Setup
- [ ] Connected to MongoDB
- [ ] Inserted 5 sidebar links for Complaints menu
- [ ] Verified sidebar links exist
- [ ] Checked user route permissions
- [ ] Set users to `mode: "allow_all"` OR added complaint routes to custom permissions

### Server Setup
- [ ] Restarted server
- [ ] No errors in server logs
- [ ] Routes registered properly

### Panel Testing
- [ ] Logged out and logged in again
- [ ] Complaints menu visible in sidebar
- [ ] Can navigate to all complaint routes
- [ ] No "Access Denied" errors

---

## Troubleshooting

### Issue: Sidebar Links Not Showing

**Check 1: Verify links in database**
```javascript
db.sidebarlinks.find({ parentLink: "Complaints" })
```

**Check 2: Check user sidebar permissions**
```javascript
db.dashboardusers.findOne(
  { email: "YOUR_EMAIL" },
  { sidebarPermissions: 1 }
)
```

**Fix: Set sidebar permissions to allow_all**
```javascript
db.dashboardusers.updateOne(
  { email: "YOUR_EMAIL" },
  {
    $set: {
      "sidebarPermissions.mode": "allow_all",
      "sidebarPermissions.allowedLinkIds": [],
      "sidebarPermissions.blockedLinkIds": []
    }
  }
)
```

---

### Issue: "Access Denied" Error

**Check 1: Check route permissions**
```javascript
db.dashboardusers.findOne(
  { email: "YOUR_EMAIL" },
  { routePermissions: 1 }
)
```

**Fix 1: Set to allow_all (Recommended)**
```javascript
db.dashboardusers.updateOne(
  { email: "YOUR_EMAIL" },
  { $set: { "routePermissions.mode": "allow_all" } }
)
```

**Fix 2: Add specific routes (if custom mode needed)**
```javascript
db.dashboardusers.updateOne(
  { email: "YOUR_EMAIL" },
  {
    $addToSet: {
      "routePermissions.allowedRoutes": {
        $each: [
          "/file-complaint",
          "/complaint/*",
          "/user-complaint",
          "/your-complaints"
        ]
      }
    }
  }
)
```

---

### Issue: Admin Complaint Visible to Non-Admins

**Check: Verify role array**
```javascript
db.sidebarlinks.findOne({ childLink: "/complaint/admin/create" })
```

**Fix: Update role array**
```javascript
db.sidebarlinks.updateOne(
  { childLink: "/complaint/admin/create" },
  { $set: { role: ["Admin", "Developer"] } }
)
```

---

## Quick Commands Summary

```javascript
// ============================================
// COMPLETE SETUP IN ONE GO
// ============================================

// 1. Add sidebar links (run insertMany from Step 1)

// 2. Set ALL users to allow_all mode
db.dashboardusers.updateMany(
  {},
  {
    $set: {
      "routePermissions.mode": "allow_all",
      "sidebarPermissions.mode": "allow_all"
    }
  }
)

// 3. Verify
db.sidebarlinks.find({ parentLink: "Complaints" }).count()
// Should return: 5

db.dashboardusers.find(
  { "routePermissions.mode": "allow_all" }
).count()
// Should return: total number of users

// ============================================
// DONE! Logout/Login and test
// ============================================
```

---

## Expected Final Structure

### Sidebar Menu (After Setup)
```
📁 Complaints
  ├─ 📄 File Complaint        [All Roles]
  ├─ 👤 User Complaint        [All Roles]
  ├─ ⚙️ Admin Complaint       [Admin, Developer only]
  ├─ 📋 All Complaints        [All Roles]
  └─ 💬 Your Complaints       [All Roles]
```

### Route Access (After Setup)
All users with `mode: "allow_all"` can access all routes based on their role in sidebar.

### Role-Based Visibility
- **Admin & Developer:** See all 5 menu items
- **PMS, TMS, CA, Rider:** See 4 menu items (Admin Complaint hidden)

---

## Automated Script Alternative

Instead of manual commands, you can run:

```bash
cd server
node scripts/setup-complaint-routes-complete.js
```

This script will:
- ✅ Add all sidebar links
- ✅ Check route permissions
- ✅ Show warnings for users with custom permissions
- ✅ Provide recommendations

---

## Summary

✅ **5 Sidebar Links** added to Complaints menu
✅ **Route Permissions** configured (allow_all recommended)
✅ **Role-Based Access** working (Admin Complaint for Admin/Developer only)
✅ **No Access Denied** errors

**Key Point:** Set `routePermissions.mode: "allow_all"` for all users unless you specifically need custom route restrictions!
