# How to Add Complaint Sidebar Links to Database

## 📋 Overview
You need to add 5 new complaint sidebar links to your MongoDB database so they appear in the panel navigation menu.

---

## ✅ Quick Start - Choose Your Method

### Method 1: Node.js Script (Recommended)
**When to use:** When you have network connectivity to MongoDB

```bash
cd server
node scripts/add-complaint-sidebar-links.js
```

✅ **Advantages:**
- Automatic duplicate detection
- Shows before/after comparison
- Safe and idempotent (can run multiple times)
- Formatted output

---

### Method 2: Direct MongoDB Commands
**When to use:** If script fails due to network issues

See detailed commands in:
```
server/scripts/COMPLAINT_SIDEBAR_LINKS_COMMANDS.md
```

**Quick MongoDB Shell Commands:**
```bash
# Connect
mongosh "mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel"

# Insert (copy from COMPLAINT_SIDEBAR_LINKS_COMMANDS.md)
db.sidebarlinks.insertMany([...])
```

---

### Method 3: REST API (Postman/Thunder Client)
**When to use:** If you prefer using API clients

**Files provided:**
- `server/scripts/add-links-via-api.http` - REST Client format
- `server/scripts/Complaint_Sidebar_Links.postman_collection.json` - Postman collection

**Steps:**
1. Import Postman collection
2. Set variables: `baseUrl` and `token`
3. Run requests 1-5 sequentially
4. Run "Verify" request to check

---

### Method 4: MongoDB Compass (GUI)
**When to use:** If you prefer visual database management

**Steps:**
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `Hotel` → `sidebarlinks` collection
4. Use "Insert Document" for each link
5. Copy JSON from `COMPLAINT_SIDEBAR_LINKS_COMMANDS.md`

---

## 📝 What Links Will Be Added

| Order | Label | Route | Roles | Icon |
|-------|-------|-------|-------|------|
| 1 | File Complaint | `/file-complaint` | All | FileText |
| 2 | User Complaint | `/complaint/user/create` | All | User |
| 3 | **Admin Complaint** | `/complaint/admin/create` | **Admin, Developer** | UserCog |
| 4 | All Complaints | `/user-complaint` | All | List |
| 5 | Your Complaints | `/your-complaints` | All | MessageSquare |

**"All" = Admin, Developer, PMS, TMS, CA, Rider**

---

## 🔍 Verification Steps

### 1. Check Database
```javascript
// MongoDB Shell
db.sidebarlinks.find({ parentLink: "Complaints" }).sort({ order: 1 })
```

Expected: 5 documents with proper roles

### 2. Restart Server
```bash
cd server
npm start
```

### 3. Test in Panel
1. **Login as Admin/Developer:**
   - Should see all 5 complaint links in sidebar
   - Navigate to each route to verify

2. **Login as PMS/TMS/CA/Rider:**
   - Should see 4 links (Admin Complaint hidden)
   - Verify role-based visibility

3. **Test Navigation:**
   - Click "File Complaint" → Should show selection page
   - Admin: Should see both User & Admin cards
   - Non-Admin: Should see only User card

---

## 🚨 Troubleshooting

### Links Not Showing?
**Problem:** Sidebar links added but not visible

**Solutions:**
1. **Force Refresh:** Logout and login again
2. **Check Permissions:** User might have custom sidebar permissions
   ```javascript
   db.dashboardusers.findOne(
     { email: "your@email.com" }, 
     { sidebarPermissions: 1 }
   )
   ```
3. **Clear Browser Cache:** Hard refresh (Ctrl+Shift+R)

### Admin Complaint Visible to Non-Admins?
**Problem:** All users seeing Admin Complaint

**Solution:** Check role array in database
```javascript
db.sidebarlinks.findOne({ childLink: "/complaint/admin/create" })
```

Should have: `role: ["Admin", "Developer"]`

Fix if wrong:
```javascript
db.sidebarlinks.updateOne(
  { childLink: "/complaint/admin/create" },
  { $set: { role: ["Admin", "Developer"] } }
)
```

### Script Connection Error?
**Problem:** `ECONNREFUSED` or network error

**Solution:** Use **Method 2** (Direct MongoDB) or **Method 4** (Compass)

### Duplicate Key Error?
**Problem:** Links already exist

**Solution:** Script auto-skips duplicates. If using manual insert:
```javascript
// Find and delete old link first
db.sidebarlinks.deleteOne({ childLink: "/old-route" })

// Then insert new link
db.sidebarlinks.insertOne({...})
```

---

## 📂 Files Reference

| File | Purpose |
|------|---------|
| `server/scripts/add-complaint-sidebar-links.js` | **Automated script** |
| `server/scripts/COMPLAINT_SIDEBAR_LINKS_COMMANDS.md` | **Manual MongoDB commands** |
| `server/scripts/add-links-via-api.http` | **REST Client requests** |
| `server/scripts/Complaint_Sidebar_Links.postman_collection.json` | **Postman collection** |
| `server/scripts/check-complaint-links.js` | Check existing links |
| `COMPLAINT_TYPE_SYSTEM.md` | Full system documentation |

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Check existing complaint links
mongosh "YOUR_MONGO_URI" --eval "db.sidebarlinks.find({parentLink:'Complaints'})"

# Run automated script
cd server && node scripts/add-complaint-sidebar-links.js

# Check server logs
cd server && npm start

# Test API endpoint
curl http://localhost:5000/api/additional/sidebar-links?status=active

# Restart panel dev server
cd panel && npm start
```

---

## ✨ Expected Result

After adding links successfully:

**Sidebar Menu Structure:**
```
📁 Complaints
  ├─ 📄 File Complaint (All users)
  ├─ 👤 User Complaint (All users)
  ├─ ⚙️ Admin Complaint (Admin & Developer only)
  ├─ 📋 All Complaints (All users)
  └─ 💬 Your Complaints (All users)
```

**User Experience:**
- Regular users: See 4 menu items
- Admin/Developer: See all 5 menu items
- Role-based card visibility on selection page
- Proper navigation and permissions

---

## 🚀 Next Steps After Adding Links

1. ✅ Verify links in database
2. ✅ Restart server
3. ✅ Test with different user roles
4. ✅ Verify navigation works
5. ✅ Test complaint creation flows
6. ✅ Check complaint list pages

---

## 📞 Need Help?

If you encounter issues:
1. Check `server/scripts/COMPLAINT_SIDEBAR_LINKS_COMMANDS.md` for detailed commands
2. Verify MongoDB connection string in `.env`
3. Check server logs for errors
4. Ensure user has proper role assignment

---

## Summary

✅ **5 sidebar links** to add
✅ **4 methods** available (choose what works best)
✅ **Role-based access** configured
✅ **Automatic verification** included in script

**Recommended:** Try Method 1 (script) first. If network issues, use Method 2 (direct MongoDB).
