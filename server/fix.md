# Bug Fix Report — Travel Module

**Date:** March 27, 2026

---

## Fix 1 — Update Car returning 500

### File Changed
`routes/travel/car.js`

### Root Cause
`update-a-car` route pe `auth` middleware missing tha. Controller ke andar `req.user.id` access hota hai ownership check ke liye — bina auth ke `req.user` = `undefined` hota hai, jo `TypeError` throw karta hai aur 500 deta hai.

### Change

```js
// Before
router.patch('/update-a-car/:id', upload, updateCar);

// After
router.patch('/update-a-car/:id', auth, upload, updateCar);
```

---

## Fix 2 — Create Booking returning 500 (userId: "demo-user")

### File Changed
`controllers/user.js`

### Root Cause
Teen login/auth responses me `_id` field nahi thi:
- `signIn` (email + password)
- `GoogleSignIn` (existing user branch)
- `verifyOTP`

Frontend ka `normalizeAuthPayload()` function `source._id` check karta hai pehle — jab ye field missing hoti hai to fallback `"demo-user"` string store ho jata hai `userId` me. Booking create karte waqt yahi invalid string server ko bhejta hai aur crash hota hai.

### Change — signIn

```js
// Before
res.status(200).json({
  message: "Sign-in successful",
  userId: user.userId,
  ...
});

// After
res.status(200).json({
  message: "Sign-in successful",
  _id: user._id,
  userId: user.userId,
  ...
});
```

### Change — GoogleSignIn (existing user)

```js
// Before
return res.status(201).json({
  message: "User already exists",
  userId: existingUser.userId,
  ...
});

// After
return res.status(201).json({
  message: "User already exists",
  _id: existingUser._id,
  userId: existingUser.userId,
  ...
});
```

### Change — verifyOTP

```js
// Before
res.status(200).json({
  result,
  userId: user.userId,
  ...
});

// After
res.status(200).json({
  result,
  _id: user._id,
  userId: user.userId,
  ...
});
```

---

## Summary

| # | File | Change | Effect |
|---|------|--------|--------|
| 1 | `routes/travel/car.js` | `auth` middleware added to `PATCH /update-a-car/:id` | 500 fix — `req.user` ab available hoga |
| 2 | `controllers/user.js` | `_id` field added to all 3 login responses | Frontend sahi `userId` store karega, `"demo-user"` fallback nahi jayega |
