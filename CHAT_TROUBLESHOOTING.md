# 🔧 Chat Real-Time - Quick Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: Pesan Tidak Diterima Real-Time

**Symptoms:**

- Pesan terkirim tapi tidak muncul di penerima tanpa refresh
- Console tidak menampilkan "📨 New message received"

**Checklist:**

```bash
✅ Check WebSocket connection
   → Look for "🟢 WebSocket Connected: PUSHER"

✅ Check channel subscription
   → Look for "✅ Successfully subscribed to private-chat.{id}"

✅ Check authentication
   → Look for "✅ Pusher Auth Success"

✅ Verify backend broadcasting
   → Check Laravel logs for broadcast events

✅ Test with Pusher Dashboard
   → Open https://dashboard.pusher.com/apps/{app_id}/debug_console
   → Send test event to verify
```

**Solutions:**

```javascript
// 1. Verify .env configuration
EXPO_PUBLIC_BROADCAST_PROVIDER=pusher // Correct value
EXPO_PUBLIC_PUSHER_KEY=your_key_here  // Must match backend

// 2. Check token validity
const token = await AsyncStorage.getItem("userToken");
console.log("Token:", token); // Should not be null

// 3. Restart app after .env changes
npx expo start -c
```

---

### Issue 2: Duplicate Messages

**Symptoms:**

- Same message appears 2-3 times
- Console shows "⚠️ Message already processed"

**Cause:**

- Backend broadcasts to multiple channels
- Frontend subscribes multiple times

**Solution:**
Already handled in code! If you still see duplicates:

```typescript
// Check this in your console:
"⚠️ Already subscribed to channel, skipping...";

// If NOT showing, check if useEffect is running multiple times
// Add this at top of component:
console.log("🔍 Component render count");
```

---

### Issue 3: Messages Not Showing After Send

**Symptoms:**

- Message shows "sending" forever
- No error alert displayed

**Checklist:**

```bash
✅ Check API response
   → Look for "✅ Message sent successfully"

✅ Check network connection
   → Airplane mode test

✅ Verify endpoint
   → POST /chat/conversations/{id}/messages

✅ Check backend response format
   → Must return { data: { id_message, message, sender, created_at } }
```

**Solutions:**

```javascript
// 1. Check console for errors
"❌ Pusher Auth Failed" // Auth issue
"❌ Status: 500" // Backend error
"❌ Network Error" // Connection issue

// 2. Test API directly
curl -X POST https://api.trisuladana.com/api/chat/conversations/123/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

---

### Issue 4: App Crashes When Opening Chat

**Symptoms:**

- White screen
- "Cannot read property 'map' of undefined"

**Cause:**

- Messages state not initialized properly
- API response format mismatch

**Solution:**

```typescript
// Already handled in code with:
const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];

// If still crashing, check API response:
console.log("API Response:", response.data);

// Expected format:
{
  data: {
    messages: [ /* array of messages */ ],
    conversation: { /* conversation data */ }
  }
}
```

---

### Issue 5: WebSocket Disconnects Frequently

**Symptoms:**

- "🔴 WebSocket Disconnected" in console
- Messages not received until reconnect

**Causes & Solutions:**

```bash
1. Poor network connection
   → Enable "Auto-reconnect" (already enabled in code)
   → Check Pusher dashboard for connection drops

2. Server timeout
   → Backend: Increase max_execution_time
   → Check Laravel queue:work is running

3. Token expired
   → Implement token refresh mechanism
   → Check AsyncStorage for valid token

4. Pusher connection limit
   → Free tier: 100 connections
   → Upgrade plan if needed
```

---

### Issue 6: Authentication Failed

**Symptoms:**

- "❌ Pusher Auth Failed: private-chat.123"
- "❌ Status: 401" or "403"

**Solutions:**

```typescript
// 1. Check token in storage
const token = await AsyncStorage.getItem("userToken");
console.log("Token exists:", !!token);

// 2. Verify backend auth endpoint
// In Laravel: routes/channels.php
Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    // Must return true or user object
    return $user->canAccessConversation($conversationId);
});

// 3. Check CORS on /broadcasting/auth
// In Laravel: config/cors.php
'paths' => ['api/*', 'broadcasting/auth'],
```

---

### Issue 7: Messages Out of Order

**Symptoms:**

- Newest message appears in middle of list
- Timestamps not sequential

**Cause:**

- created_at field formatting
- Timezone mismatch

**Solution:**

```typescript
// Already handled in code with:
created_at: newMsg.created_at || newMsg.sent_at || new Date().toISOString();

// Verify backend returns ISO 8601 format:
("2025-12-09T10:30:00.000000Z");
```

---

### Issue 8: Can't Send Messages After Logout/Login

**Symptoms:**

- First message fails after re-login
- "Token otentikasi tidak ditemukan"

**Solution:**

```typescript
// Ensure token is set before entering chat
// In AuthContext.tsx login():
await AsyncStorage.setItem("userToken", authToken);
await AsyncStorage.setItem("userData", JSON.stringify(userData));

// Wait for storage write
await new Promise((resolve) => setTimeout(resolve, 100));

// Then navigate to chat
```

---

## 🔍 Debugging Commands

### Check WebSocket Connection

```javascript
// In browser/dev tools console
echo.connector.pusher.connection.state;
// Should return: "connected"
```

### Monitor All Events

```javascript
// Temporary debug code - add to [conversationId].tsx
channel.bind_global((event: string, data: any) => {
  console.log("🔔 Event:", event, "Data:", data);
});
```

### Test Message Send

```javascript
// Direct API test
await api.post("/chat/conversations/123/messages", {
  message: "Test message " + Date.now(),
});
```

### Clear All Cache

```bash
# Terminal
npx expo start -c

# Or delete and reinstall
rm -rf node_modules
npm install
```

---

## 📊 Health Check

Run this checklist to verify everything is working:

```typescript
// Add this function to your chat screen temporarily:
const healthCheck = async () => {
  console.log("🏥 HEALTH CHECK START");

  // 1. Token
  const token = await AsyncStorage.getItem("userToken");
  console.log("✅ Token exists:", !!token);

  // 2. WebSocket
  const wsState = echo.connector?.pusher?.connection?.state;
  console.log("✅ WebSocket state:", wsState);

  // 3. Channel
  console.log("✅ Channel subscribed:", !!echoChannelRef.current);

  // 4. Messages
  console.log("✅ Messages count:", messages.length);

  // 5. Processed IDs
  console.log("✅ Tracked IDs:", processedMessageIds.current.size);

  console.log("🏥 HEALTH CHECK COMPLETE");
};

// Call it when needed
useEffect(() => {
  setTimeout(healthCheck, 2000);
}, []);
```

---

## 🎯 Performance Monitoring

### Check for Memory Leaks

```javascript
// Before entering chat
console.log("Memory:", performance.memory.usedJSHeapSize);

// After leaving chat
console.log("Memory:", performance.memory.usedJSHeapSize);

// Should be similar (±10%)
```

### Monitor Message Processing Time

```javascript
// In Echo listener
const startTime = Date.now();
// ... process message ...
console.log("⏱️ Processing time:", Date.now() - startTime, "ms");
// Should be < 100ms
```

---

## 📞 Get Help

### Log Collection

```bash
# Collect all relevant logs
1. Console logs (check browser/expo dev tools)
2. Network tab (check API calls)
3. Pusher Dashboard logs
4. Laravel logs (storage/logs/laravel.log)
```

### Report Template

````
**Issue:** [Brief description]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected:** [What should happen]
**Actual:** [What actually happens]

**Logs:**
```console
[Paste relevant console logs]
````

**Environment:**

- Provider: [pusher/reverb]
- API URL: [your API]
- App Version: [version]

```

---

## ✅ Prevention Checklist

Before deploying to production:

- [ ] Test on slow network (3G simulation)
- [ ] Test offline → online transition
- [ ] Test with multiple users simultaneously
- [ ] Test rapid message sending (spam test)
- [ ] Test logout → login → chat flow
- [ ] Test app background → foreground
- [ ] Test kill app → reopen
- [ ] Load test: 100+ messages in conversation
- [ ] Monitor memory usage over time
- [ ] Check Pusher connection limits

---

*Quick Reference v1.0*
*Last Updated: December 9, 2025*
```
