# 🎯 Final Setup Guide - Complaint Routes & Sidebar

## क्या करना है (What to Do)

आपको 5 नए complaint routes को database में add करना है ताकि:
1. ✅ Sidebar menu में दिखें
2. ✅ Access Denied error न आए
3. ✅ Role-based access काम करे

---

## 🚀 Quick Start (सबसे आसान तरीका)

### विकल्प 1: MongoDB Shell Commands (Recommended)

```bash
# 1. MongoDB Connect करें
mongosh "mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel"

# 2. Sidebar Links Add करें
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

# 3. Access Denied से बचने के लिए - सभी users को allow_all करें
db.dashboardusers.updateMany(
  {},
  {
    $set: {
      "routePermissions.mode": "allow_all",
      "sidebarPermissions.mode": "allow_all"
    }
  }
)

# 4. Verify करें
db.sidebarlinks.find({ parentLink: "Complaints" }).count()
# Output: 5 (होना चाहिए)

# Done! ✅
```

---

### विकल्प 2: MongoDB Compass (GUI)

1. **MongoDB Compass खोलें**
2. **Connect करें:** `mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel`
3. **Database:** `Hotel` → Collection: `sidebarlinks`
4. **"Add Data"** → **"Insert Document"** पर क्लिक करें
5. ऊपर दिए गए 5 documents एक-एक करके insert करें
6. **Collection:** `dashboardusers` में जाएं
7. सभी users को select करें और update करें:
   ```json
   {
     "routePermissions.mode": "allow_all",
     "sidebarPermissions.mode": "allow_all"
   }
   ```

---

### विकल्प 3: Node.js Script (जब network काम कर रहा हो)

```bash
cd server
node scripts/setup-complaint-routes-complete.js
```

---

## 📋 Added Routes की List

| क्रम | नाम | Route | किसको दिखेगा |
|------|-----|-------|--------------|
| 1 | File Complaint | `/file-complaint` | सबको |
| 2 | User Complaint | `/complaint/user/create` | सबको |
| 3 | **Admin Complaint** | `/complaint/admin/create` | **सिर्फ Admin & Developer** |
| 4 | All Complaints | `/user-complaint` | सबको |
| 5 | Your Complaints | `/your-complaints` | सबको |

---

## 🔒 Access Denied से कैसे बचें

### समस्या: Routes add किए but "Access Denied" आ रहा है

**कारण:** User के `routePermissions.mode` में `custom` set है

**समाधान 1: सभी को allow_all करें (Recommended)**
```javascript
db.dashboardusers.updateMany(
  {},
  { $set: { "routePermissions.mode": "allow_all" } }
)
```

**समाधान 2: Specific user को allow_all करें**
```javascript
db.dashboardusers.updateOne(
  { email: "user@example.com" },
  { $set: { "routePermissions.mode": "allow_all" } }
)
```

**समाधान 3: Custom mode में routes add करें (अगर जरूरत हो)**
```javascript
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

---

## ✅ Verification Steps (जांच करें)

### 1. Database में Check करें
```javascript
// Sidebar links count
db.sidebarlinks.find({ parentLink: "Complaints" }).count()
// Expected: 5

// Show all complaint links
db.sidebarlinks.find({ parentLink: "Complaints" }).sort({ order: 1 })

// Check your user's permissions
db.dashboardusers.findOne(
  { email: "YOUR_EMAIL" },
  { routePermissions: 1, sidebarPermissions: 1 }
)
```

### 2. Server Restart करें
```bash
cd server
npm start
```

### 3. Panel में Test करें
1. **Logout करें**
2. **फिर से Login करें**
3. **Sidebar में Complaints menu देखें**
4. **हर route पर जाकर check करें**

---

## 🎯 Expected Result (क्या दिखना चाहिए)

### Admin/Developer को दिखेगा:
```
📁 Complaints
  ├─ 📄 File Complaint
  ├─ 👤 User Complaint
  ├─ ⚙️ Admin Complaint       ← सिर्फ Admin/Developer को
  ├─ 📋 All Complaints
  └─ 💬 Your Complaints
```

### PMS/TMS/CA/Rider को दिखेगा:
```
📁 Complaints
  ├─ 📄 File Complaint
  ├─ 👤 User Complaint
  ├─ 📋 All Complaints
  └─ 💬 Your Complaints
```

---

## 🚨 Common Problems & Solutions

### Problem 1: Sidebar में links नहीं दिख रहे

**Solution:**
```javascript
// Check sidebar permissions
db.dashboardusers.findOne(
  { email: "YOUR_EMAIL" },
  { sidebarPermissions: 1 }
)

// Fix: Set to allow_all
db.dashboardusers.updateOne(
  { email: "YOUR_EMAIL" },
  { $set: { "sidebarPermissions.mode": "allow_all" } }
)
```

### Problem 2: Access Denied error आ रहा है

**Solution:**
```javascript
// Set route permissions to allow_all
db.dashboardusers.updateOne(
  { email: "YOUR_EMAIL" },
  { $set: { "routePermissions.mode": "allow_all" } }
)
```

### Problem 3: Admin Complaint सबको दिख रहा है

**Solution:**
```javascript
// Check role array
db.sidebarlinks.findOne({ childLink: "/complaint/admin/create" })

// Fix role array
db.sidebarlinks.updateOne(
  { childLink: "/complaint/admin/create" },
  { $set: { role: ["Admin", "Developer"] } }
)
```

### Problem 4: Duplicate key error

**Solution:**
```javascript
// Find and remove duplicate
db.sidebarlinks.find({ childLink: "/file-complaint" })

// Delete extra ones by _id
db.sidebarlinks.deleteOne({ _id: ObjectId("DUPLICATE_ID") })
```

---

## 📂 Files Reference

| फाइल | काम |
|------|-----|
| `server/scripts/setup-complaint-routes-complete.js` | Automated script |
| `server/scripts/COMPLETE_SETUP_COMMANDS.md` | Detailed MongoDB commands |
| `server/scripts/add-links-via-api.http` | REST API requests |
| `COMPLAINT_TYPE_SYSTEM.md` | Full documentation |
| `FINAL_SETUP_GUIDE.md` | यह guide |

---

## 💡 Important Notes

### Route Permissions समझें:

**`mode: "allow_all"`** (Recommended)
- ✅ सभी routes accessible हैं
- ✅ कोई Access Denied नहीं
- ✅ सबसे आसान

**`mode: "custom"`**
- ⚠️ सिर्फ `allowedRoutes` में दिए routes accessible हैं
- ⚠️ बाकी सब blocked
- ⚠️ हर नए route को manually add करना पड़ेगा

**सिफारिश (Recommendation):** सभी को `allow_all` रखें unless आपको specific users को restrict करना है।

---

## 🎉 Final Checklist

Database में:
- [ ] 5 sidebar links inserted
- [ ] सभी users का `routePermissions.mode = "allow_all"`
- [ ] सभी users का `sidebarPermissions.mode = "allow_all"`

Server में:
- [ ] Server restart किया
- [ ] कोई error नहीं

Panel में:
- [ ] Logout/Login किया
- [ ] Complaints menu में 5 links दिख रहे (Admin के लिए)
- [ ] Complaints menu में 4 links दिख रहे (Non-admin के लिए)
- [ ] सभी routes काम कर रहे
- [ ] कोई Access Denied नहीं

---

## 🚀 Quick Commands (Copy-Paste Ready)

```javascript
// MongoDB Shell में ये commands run करें:

// 1. Sidebar links add करें (ऊपर दिया गया insertMany command)

// 2. Access fix करें
db.dashboardusers.updateMany({}, {$set: {"routePermissions.mode": "allow_all", "sidebarPermissions.mode": "allow_all"}})

// 3. Verify करें
db.sidebarlinks.find({parentLink:"Complaints"}).count()  // Should be 5
db.dashboardusers.find({"routePermissions.mode":"allow_all"}).count()  // Should be total users count

// Done! ✅
```

---

## Summary (सारांश)

✅ **5 Routes** add करने हैं database में
✅ **Sidebar Links** Complaints menu में
✅ **Route Permissions** allow_all रखें
✅ **Role-Based Access** Admin Complaint सिर्फ Admin/Developer को
✅ **No Access Denied** सभी को proper access

**अगला कदम:** MongoDB Shell खोलें और ऊपर दिए commands run करें! 🚀
