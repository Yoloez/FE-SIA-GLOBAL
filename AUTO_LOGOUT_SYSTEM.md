# 🔐 AUTO LOGOUT SYSTEM

## ✅ IMPLEMENTED FEATURES

### **1. Axios Response Interceptor**

**File:** `api/axios.ts`

Automatically detects **401 Unauthorized** responses and triggers logout:

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Auto logout: Clear storage
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.setItem("forceLogout", "true");
    }
    return Promise.reject(error);
  }
);
```

**How it works:**

1. ❌ API returns 401 (Unauthorized)
2. 🧹 Interceptor clears token & user data
3. 🚩 Sets `forceLogout` flag
4. 🔄 AuthContext detects flag and triggers logout
5. 🏠 User redirected to login screen

---

### **2. AuthContext Monitoring**

**File:** `context/AuthContext.tsx`

**A. On App Start:**

```typescript
// Check forceLogout flag immediately
const forceLogoutFlag = await AsyncStorage.getItem("forceLogout");
if (forceLogoutFlag === "true") {
  // Clear everything and logout
  await AsyncStorage.removeItem("forceLogout");
  setUser(null);
  setToken(null);
}
```

**B. Continuous Monitoring:**

```typescript
// Check every 2 seconds for force logout
setInterval(async () => {
  const flag = await AsyncStorage.getItem("forceLogout");
  if (flag === "true") {
    await AsyncStorage.removeItem("forceLogout");
    setUser(null);
    setToken(null);
  }
}, 2000);
```

---

### **3. Enhanced Error Handling**

**File:** `app/(mahasiswa)/index.tsx`

All API calls now have comprehensive error logging:

```typescript
try {
  const response = await api.get("/student/profile/identity");
  // Success handling...
} catch (error: any) {
  console.error("[MAHASISWA HOME] Error:", error);
  console.error("Status:", error.response?.status);

  if (error.response?.status === 401) {
    console.log("401 detected - auto logout will trigger");
  }
}
```

**API calls with error handling:**

- ✅ `fetchStudentIdentity()` - Student profile
- ✅ `fetchGrades()` - Academic grades
- ✅ `fetchSchedules()` - Class schedules
- ✅ `fetchUnreadCount()` - Notification count

---

## 🔄 AUTO LOGOUT FLOW

```
┌─────────────────────────────────────────┐
│  User makes API request                 │
│  (e.g., fetch student profile)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API returns 401 Unauthorized           │
│  (Token expired or invalid)             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Axios Interceptor catches error        │
│  - Clears userToken                     │
│  - Clears userData                      │
│  - Sets forceLogout = "true"            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AuthContext detects forceLogout flag   │
│  (checked every 2 seconds)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AuthContext sets user & token = null   │
│  (isLoggedIn becomes false)             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  _layout.tsx detects isLoggedIn=false   │
│  and redirects to /(auth)/login         │
└─────────────────────────────────────────┘
```

---

## 📊 LOGGING

When 401 error occurs, you'll see logs like:

```
========================================
[AXIOS INTERCEPTOR] Response Error Detected
[AXIOS INTERCEPTOR] Status: 401
[AXIOS INTERCEPTOR] Message: Unauthenticated
========================================
[AXIOS INTERCEPTOR] 401 Unauthorized - Auto logout triggered
[AXIOS INTERCEPTOR] User data cleared, redirecting to login...
========================================
[AUTH CONTEXT] Force logout detected in interval check
[ROUTE] State: {"isLoggedIn": false, "role": null}
[ROUTE] User tidak login
[ROUTE] Redirect ke login
========================================
```

---

## 🎯 WHY THIS SOLVES "TERJEBAK DI HALAMAN"

**Problem Before:**

- ❌ Token expired
- ❌ API returns 401
- ❌ User stuck on page with loading spinner
- ❌ No way to escape without force close

**Solution Now:**

- ✅ 401 detected automatically
- ✅ User logged out instantly
- ✅ Redirected to login screen
- ✅ Can login again with fresh token
- ✅ No more stuck/trapped users

---

## 🧪 TESTING

**Test Scenario 1: Normal Logout**

1. Login sebagai mahasiswa
2. Tap logout button
3. ✅ Should redirect to login

**Test Scenario 2: Token Expired (Auto Logout)**

1. Login sebagai mahasiswa
2. Wait until token expires (or manually delete token from backend)
3. Pull to refresh / navigate to any page
4. ✅ Should auto logout and redirect to login

**Test Scenario 3: Invalid Token**

1. Login sebagai mahasiswa
2. Manually corrupt token in AsyncStorage
3. Navigate to any page
4. ✅ Should detect 401 and auto logout

---

## 📝 BENEFITS

✅ **Auto Recovery** - No more stuck users
✅ **Better UX** - Smooth transition to login
✅ **Security** - Invalid tokens cleared immediately
✅ **Debugging** - Comprehensive error logs
✅ **Global Solution** - Works for ALL screens automatically
✅ **No User Action Required** - Fully automatic

---

## 🚀 NEXT STEPS

Test the auto logout by:

1. Login to app
2. Delete token from backend (or wait for expiry)
3. Try to fetch data
4. Watch the auto logout magic happen! ✨

No more force close, no more stuck users! 🎉
