# 🎉 API Interceptor System - Hindi Explanation

## ✅ Kya Kya Setup Ho Gaya Hai

Aapke project mein ab **professional API interceptor system** complete ho gaya hai with:

### 1. **Redux Toolkit** ✅
- State management ke liye
- `authSlice` - User authentication ko handle karta hai
- `serverSlice` - Server connectivity ko track karta hai

### 2. **Axios Interceptor** ✅
- Har API call automatically handle hota hai
- Token automatically add hota hai
- Server connectivity check hoti rehti hai
- Errors automatically handle hote hain

### 3. **Beautiful Error Page** ✅
- Jab server down ho, Tailwind-styled error page dikhta hai
- Retry button milta hai
- Professional design

---

## 🎯 Main Features

### 1. **Automatic Token Handling**
```javascript
// Login karne par:
- Token automatically localStorage mein save ho jata hai
- Har API call mein token automatic add ho jata hai
- Logout par token remove ho jata hai

// Aapko manually kuch nahi karna!
```

### 2. **withCredentials: true**
```javascript
// Har request mein automatically:
- Cookies send hoti hain
- Credentials include hote hain
- Token header mein add hota hai
```

### 3. **Server Health Check**
```javascript
// Har 30 second mein:
- Server check hota hai ki connected hai ya nahi
- Redux state update hoti hai
- Agar server down hai to error page dikha deta hai
```

### 4. **Error Handling**
Sabhi errors automatic handle hote hain:
- ❌ Network error → Error page
- ❌ 401 Unauthorized → Token remove, login page
- ❌ 403 Forbidden → Access denied message
- ❌ 500+ Server error → Error page
- ❌ Timeout → Timeout message

---

## 🚀 Kaise Use Karein

### 1. Backend URL Update Karein
`utils/baseUrl.js` mein:
```javascript
const baseURL = 'http://localhost:5000'; // Apna backend URL dalein
```

### 2. API Call Kaise Karein

#### Login Example:
```javascript
import { authAPI } from '../services/api';
import { loginSuccess } from '../redux/slices/authSlice';

const handleLogin = async () => {
  try {
    // API call (token automatic save hoga)
    const response = await authAPI.login({ 
      email: 'user@example.com', 
      password: 'password' 
    });
    
    // Redux state update karein
    dispatch(loginSuccess({
      user: response.user,
      token: response.token
    }));
    
    // Ab sab API calls mein token automatically jayega!
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

#### Rooms Get Karne Ke Liye:
```javascript
import { hotelAPI } from '../services/api';

const getRooms = async () => {
  try {
    // Token automatic add hoga
    const rooms = await hotelAPI.getAllRooms();
    console.log(rooms);
  } catch (error) {
    // Agar server down hai, error page automatic dikha dega
    console.error('Failed:', error);
  }
};
```

#### Booking Create Karne Ke Liye:
```javascript
import { bookingAPI } from '../services/api';

const createBooking = async () => {
  const bookingData = {
    roomId: '123',
    checkIn: '2025-01-01',
    checkOut: '2025-01-05'
  };
  
  // Token automatic include hoga
  const booking = await bookingAPI.createBooking(bookingData);
};
```

### 3. Redux State Use Karein

```javascript
import { useSelector } from 'react-redux';

function MyComponent() {
  // Server connected hai ya nahi check karein
  const { isConnected, errorMessage } = useSelector(state => state.server);
  
  // User logged in hai ya nahi check karein
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  return (
    <div>
      {isConnected ? '✅ Server Online' : '❌ Server Offline'}
      {isAuthenticated && <p>Welcome, {user?.name}!</p>}
    </div>
  );
}
```

---

## 📊 Kaise Kaam Karta Hai

### Login Flow:
```
1. User login form submit karta hai
   ↓
2. authAPI.login() call hota hai
   ↓
3. Interceptor token check karta hai (abhi nahi hai)
   ↓
4. Backend se token milta hai
   ↓
5. Token localStorage mein save hota hai
   ↓
6. Redux state update hoti hai
   ↓
7. Ab har API call mein ye token automatically jayega!
```

### API Call with Token:
```
1. hotelAPI.getAllRooms() call karte hain
   ↓
2. Interceptor localStorage se token leke
   ↓
3. Request header mein token add karta hai
   ↓
4. withCredentials: true set karta hai
   ↓
5. Backend ko request jati hai
   ↓
6. Response milta hai
   ↓
7. Data component ko mil jata hai
```

### Server Down Situation:
```
1. API call karte hain
   ↓
2. Server se response nahi aata
   ↓
3. Interceptor error detect karta hai
   ↓
4. Redux state update: isConnected = false
   ↓
5. ApiInterceptorWrapper check karta hai
   ↓
6. Error page automatic dikha deta hai
   ↓
7. User "Retry" button click kar sakta hai
   ↓
8. Server online ho to app phir se chal jata hai
```

---

## 🛠️ Available API Services

Sab ready to use hain:

### Auth (Authentication)
```javascript
authAPI.login({ email, password })
authAPI.register({ name, email, password })
authAPI.logout()
authAPI.getCurrentUser()
```

### Hotels/Rooms
```javascript
hotelAPI.getAllRooms()
hotelAPI.getRoomById(roomId)
hotelAPI.createRoom(roomData)  // Admin only
hotelAPI.updateRoom(roomId, data)
hotelAPI.deleteRoom(roomId)
hotelAPI.searchRooms({ query, filters })
```

### Bookings
```javascript
bookingAPI.createBooking(data)
bookingAPI.getUserBookings()
bookingAPI.getBookingById(id)
bookingAPI.cancelBooking(id)
```

### User Profile
```javascript
userAPI.getProfile()
userAPI.updateProfile(data)
userAPI.uploadProfilePicture(formData)
userAPI.changePassword(data)
```

---

## 🎨 Demo App

App kholo aur dekho:

1. **Header** mein server status (green/red dot)
2. **Status bar** mein:
   - Token Auth: Enabled
   - Health Check: Every 30s
   - Last Check time
3. **"Show API Examples"** button click karke:
   - Login form dekh sakte ho
   - Rooms list example dekh sakte ho

---

## 🧪 Testing Kaise Karein

### Error Page Test Karein:
1. Backend server band kar do
2. Koi bhi API call karo
3. Error page automatic dikha dega
4. "Retry Connection" button click karo
5. Server start karo - app reconnect ho jayega

### Authentication Test Karein:
1. App mein "Show API Examples" click karo
2. Login form fill karo
3. Submit karo
4. Token automatic save hoga
5. Phir sab API calls mein token jayega

---

## 📁 Important Files

### Redux Files:
- `src/redux/store.js` - Main Redux store
- `src/redux/slices/authSlice.js` - Authentication state
- `src/redux/slices/serverSlice.js` - Server status state

### API Files:
- `src/utils/apiInterceptor.js` - Axios interceptor
- `src/services/api.js` - All API methods
- `utils/baseUrl.js` - Backend URL (YAHA APNA URL DALEIN)

### Components:
- `src/components/ApiInterceptorWrapper.jsx` - Main wrapper
- `src/components/ServerErrorPage.jsx` - Error page
- `src/components/LoginExample.jsx` - Login example
- `src/components/RoomsListExample.jsx` - API call example

---

## ✨ Automatic Features (Apne Aap Kaam Karte Hain)

1. ✅ **Token localStorage mein save** - Automatic
2. ✅ **Token har request mein add** - Automatic
3. ✅ **Server health check har 30s** - Automatic
4. ✅ **Error page jab server down** - Automatic
5. ✅ **Redux state updates** - Automatic
6. ✅ **withCredentials: true** - Automatic
7. ✅ **Error handling** - Automatic

---

## 🔧 Configuration (Optional)

### Health Check Interval Change Karein:
`src/components/ApiInterceptorWrapper.jsx` mein:
```javascript
// Default: 30 seconds
startHealthCheck(30000);

// 1 minute ke liye:
startHealthCheck(60000);

// 10 seconds ke liye:
startHealthCheck(10000);
```

### Backend URL Change Karein:
`utils/baseUrl.js` mein:
```javascript
// Development
const baseURL = 'http://localhost:5000';

// Production
const baseURL = 'https://your-backend-url.com';
```

---

## 🎯 Ab Kya Karna Hai

### Zaruri:
1. ✏️ `utils/baseUrl.js` mein apna backend URL dalein
2. ✅ Bas! Sab kaam karna shuru ho jayega

### Optional (Agar chahein):
1. API endpoints customize karein `services/api.js` mein
2. Login page banaein `LoginExample.jsx` se reference leke
3. More Redux slices add karein agar chahiye
4. Error page ka styling change karein
5. Token refresh logic add karein

---

## 🐛 Problems & Solutions

### "Cannot connect to server" dikha raha hai?
**Solution:** 
- Backend server chal raha hai check karein
- `utils/baseUrl.js` mein URL sahi hai check karein

### Token nahi ja raha hai?
**Solution:**
- `services/api.js` se API methods use kar rahe ho check karein
- localStorage mein token hai check karein: `localStorage.getItem('authToken')`
- Login ke baad `loginSuccess()` dispatch kiya check karein

### Health check kaam nahi kar raha?
**Solution:**
- Backend mein `/health` endpoint hona chahiye
- Ya `apiInterceptor.js` mein health check endpoint change karein

---

## 📦 Installed Packages

```json
{
  "@reduxjs/toolkit": "^2.11.2",   ✅ State management
  "react-redux": "^9.2.0",         ✅ Redux with React
  "axios": "^1.13.2",              ✅ API calls
  "lucide-react": "^0.562.0",      ✅ Icons
  "tailwindcss": "^4.1.18"         ✅ Styling
}
```

---

## 🎉 Summary

**Aapka system ab FULLY READY hai!** ✅

### Kya Kya Milega:
- ✅ Automatic token handling
- ✅ Server connectivity monitoring
- ✅ Beautiful error pages
- ✅ Redux state management
- ✅ Pre-built API services
- ✅ Production-ready setup

### Bas Itna Karna Hai:
1. Backend URL update karo
2. API services use karo
3. Baki sab automatic hai!

---

**Dev server chal raha hai:** http://localhost:5175

**Need Help?**
- `QUICK_START.md` - Quick reference
- `API_INTERCEPTOR_DOCUMENTATION.md` - Complete docs
- `ARCHITECTURE.md` - System diagram

**Sab setup complete hai! Start coding! 🚀**
