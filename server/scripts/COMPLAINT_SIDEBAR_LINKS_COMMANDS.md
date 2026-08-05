# Complaint Sidebar Links - MongoDB Commands

## Option 1: Run the Script (When Network is Available)

```bash
cd server
node scripts/add-complaint-sidebar-links.js
```

This script will:
- Check existing complaint links
- Add new complaint routes to sidebar
- Skip duplicates automatically
- Show final structure

---

## Option 2: Manual MongoDB Insert (Direct)

If script doesn't work due to network issues, run these commands directly in MongoDB:

### 1. Connect to MongoDB

```bash
mongosh "mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel"
```

### 2. Check Existing Complaint Links

```javascript
db.sidebarlinks.find({
  $or: [
    { parentLink: "Complaints" },
    { childLink: { $regex: "complaint", $options: "i" } }
  ]
}).pretty()
```

### 3. Insert New Complaint Sidebar Links

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

### 4. Verify Insertion

```javascript
db.sidebarlinks.find({ parentLink: "Complaints" }).sort({ order: 1 }).pretty()
```

---

## Option 3: Use MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel`
3. Go to database: `Hotel`
4. Go to collection: `sidebarlinks`
5. Click "Add Data" → "Insert Document"
6. Paste each document from the `insertMany` command above

---

## Expected Sidebar Structure

After insertion, the **Complaints** menu should have:

### For All Users (Admin, Developer, PMS, TMS, CA, Rider):
1. **File Complaint** → `/file-complaint` (Selection page)
2. **User Complaint** → `/complaint/user/create` (Direct user complaint)
3. **All Complaints** → `/user-complaint` (View all complaints)
4. **Your Complaints** → `/your-complaints` (View own complaints)

### For Admin & Developer Only:
3. **Admin Complaint** → `/complaint/admin/create` (Create on behalf of users)

---

## Role-Based Visibility

| Route | Label | Admin | Developer | PMS | TMS | CA | Rider |
|-------|-------|-------|-----------|-----|-----|-------|-------|
| `/file-complaint` | File Complaint | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/complaint/user/create` | User Complaint | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/complaint/admin/create` | Admin Complaint | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/user-complaint` | All Complaints | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/your-complaints` | Your Complaints | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Testing After Adding Links

1. **Restart the server** (if running):
   ```bash
   cd server
   npm start
   ```

2. **Login to panel** with different roles:
   - Admin user should see all 5 complaint links
   - Developer user should see all 5 complaint links
   - PMS/TMS/CA/Rider should see 4 links (Admin Complaint hidden)

3. **Check sidebar refresh**:
   - Sidebar links refresh automatically on login
   - Force refresh: Logout and login again

4. **Test navigation**:
   - Click "File Complaint" → Should show selection page
   - Admin: Should see both User & Admin complaint cards
   - Non-Admin: Should see only User complaint card

---

## Troubleshooting

### Links not showing in sidebar?
1. Check sidebar permissions in `dashboardusers` collection:
   ```javascript
   db.dashboardusers.find({ email: "youremail@example.com" }, { sidebarPermissions: 1 })
   ```

2. If `sidebarPermissions.mode` is set to `custom`, add link IDs to `allowedLinkIds`

3. Logout and login again to refresh sidebar

### Admin Complaint showing to non-admin users?
- Double-check the `role` array in database for `/complaint/admin/create` link
- Should only contain: `["Admin", "Developer"]`

### Script fails with network error?
- Use **Option 2** (Manual MongoDB commands) instead
- Or use **Option 3** (MongoDB Compass GUI)

---

## Cleanup Old Links (If Needed)

If you have duplicate or old complaint links:

```javascript
// Find all complaint links
db.sidebarlinks.find({ 
  $or: [
    { parentLink: "Complaints" },
    { childLink: { $regex: "complaint", $options: "i" } }
  ]
})

// Delete specific old link by ID
db.sidebarlinks.deleteOne({ _id: ObjectId("YOUR_ID_HERE") })

// Or delete by childLink
db.sidebarlinks.deleteOne({ childLink: "/old-complaint-route" })
```

---

## Summary

✅ **5 New Sidebar Links** added to Complaints menu
✅ **Role-based access** configured (Admin Complaint for Admin/Developer only)
✅ **Proper ordering** (order 1-5)
✅ **All routes active** and ready to use

Run the script or execute manual commands to add these links to your database!
