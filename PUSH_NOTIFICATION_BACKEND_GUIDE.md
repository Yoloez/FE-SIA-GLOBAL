# 📱 Panduan Push Notification untuk Backend

## 🎯 Tujuan

Agar notifikasi chat tetap berfungsi saat aplikasi **ditutup/background**, backend harus mengirim push notification via Expo Push Service.

## 📋 Cara Kerja

### 1️⃣ **App Dibuka (Foreground)**

- ✅ Gunakan **Laravel Echo** (Pusher WebSocket)
- User terhubung real-time via `private-chat.{id}` dan `private-user.{id}`
- Notifikasi lokal muncul langsung via `notificationService.showLocalNotification()`

### 2️⃣ **App Ditutup/Background**

- ❌ Laravel Echo **TIDAK AKTIF** (WebSocket terputus)
- ✅ Harus kirim **Push Notification** via Expo Push Service
- Backend deteksi user offline → kirim push notification

---

## 🔧 Implementasi Backend

### **Step 1: Simpan Device Token**

Endpoint frontend sudah kirim token ke backend:

```http
POST /api/notifications/register-device
Content-Type: application/json

{
  "device_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "android" // atau "ios"
}
```

**Simpan di database:**

```php
// Table: user_devices
Schema::create('user_devices', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('device_token')->unique();
    $table->enum('device_type', ['android', 'ios']);
    $table->timestamp('last_active_at')->nullable();
    $table->timestamps();
});
```

---

### **Step 2: Kirim Push Notification saat Chat**

Saat ada pesan baru:

```php
use Illuminate\Support\Facades\Http;

public function sendChatMessage(Request $request)
{
    // 1. Simpan pesan ke database
    $message = Message::create([
        'id_conversation' => $request->id_conversation,
        'sender_id' => auth()->id(),
        'message' => $request->message,
        'sent_at' => now(),
    ]);

    // 2. Broadcast via Echo (untuk user yang online)
    broadcast(new NewChatMessage($message))->toOthers();

    // 3. Kirim push notification ke user yang offline
    $conversation = Conversation::find($request->id_conversation);
    $recipientId = $conversation->getOtherParticipantId(auth()->id());

    $this->sendPushNotificationIfOffline($recipientId, [
        'type' => 'chat',
        'id_conversation' => $message->id_conversation,
        'id_message' => $message->id_message,
        'title' => auth()->user()->nama . ' mengirim pesan',
        'message' => $message->message,
        'sender' => auth()->user()->nama,
    ]);

    return response()->json($message);
}

private function sendPushNotificationIfOffline($userId, $data)
{
    // Cek apakah user sedang online (cek last_active < 30 detik)
    $isOnline = UserDevice::where('user_id', $userId)
        ->where('last_active_at', '>', now()->subSeconds(30))
        ->exists();

    if ($isOnline) {
        // User online, Echo akan handle
        return;
    }

    // User offline, kirim push notification
    $devices = UserDevice::where('user_id', $userId)->get();

    foreach ($devices as $device) {
        $this->sendExpoPushNotification($device->device_token, $data);
    }
}

private function sendExpoPushNotification($pushToken, $data)
{
    $response = Http::post('https://exp.host/--/api/v2/push/send', [
        'to' => $pushToken,
        'title' => $data['title'],
        'body' => $data['message'],
        'data' => $data, // PENTING: Data untuk navigasi
        'sound' => 'default',
        'priority' => 'high',
        'channelId' => 'chat', // Android channel
    ]);

    if (!$response->successful()) {
        \Log::error('Push notification failed', [
            'token' => $pushToken,
            'response' => $response->json()
        ]);
    }
}
```

---

### **Step 3: Update Last Active**

Buat endpoint untuk update last_active saat user masih aktif:

```php
// Frontend akan panggil setiap 20 detik saat app dibuka
Route::post('/api/notifications/heartbeat', function (Request $request) {
    UserDevice::where('user_id', auth()->id())
        ->where('device_token', $request->device_token)
        ->update(['last_active_at' => now()]);

    return response()->json(['status' => 'ok']);
});
```

---

### **Step 4: Hapus Token saat Logout**

```php
Route::delete('/api/notifications/remove-device', function (Request $request) {
    UserDevice::where('user_id', auth()->id())
        ->where('device_token', $request->device_token)
        ->delete();

    return response()->json(['message' => 'Device token removed']);
});
```

---

## 📦 Format Data Push Notification

**PENTING:** Data harus berisi `id_conversation` agar navigasi bekerja!

```json
{
  "to": "ExponentPushToken[xxxxxx]",
  "title": "John Doe mengirim pesan",
  "body": "Halo, apa kabar?",
  "data": {
    "type": "chat",
    "id_conversation": 123,
    "id_message": 456,
    "sender": "John Doe"
  },
  "sound": "default",
  "priority": "high",
  "channelId": "chat"
}
```

---

## 🧪 Testing

### Test Push Notification Manual

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[PASTE_TOKEN_DISINI]",
    "title": "Test Pesan",
    "body": "Halo dari backend!",
    "data": {
      "type": "chat",
      "id_conversation": 1,
      "id_message": 1,
      "sender": "Test User"
    }
  }'
```

**Response berhasil:**

```json
{
  "data": [
    {
      "status": "ok",
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

---

## ✅ Checklist Backend

- [ ] Table `user_devices` sudah dibuat
- [ ] Endpoint `/api/notifications/register-device` sudah berfungsi
- [ ] Endpoint `/api/notifications/heartbeat` untuk update last_active
- [ ] Endpoint `/api/notifications/remove-device` untuk logout
- [ ] Function `sendExpoPushNotification()` sudah dibuat
- [ ] Logic deteksi online/offline berdasarkan `last_active_at`
- [ ] Kirim push saat user offline dan ada pesan baru
- [ ] Data push notification berisi `id_conversation` untuk navigasi
- [ ] Test manual push notification berhasil

---

## 🔍 Debugging

### Cek Token di Database

```sql
SELECT * FROM user_devices WHERE user_id = 1;
```

### Log Push Notification

```php
\Log::info('Sending push notification', [
    'user_id' => $userId,
    'token' => $pushToken,
    'data' => $data
]);
```

### Monitor Expo Push Receipt

```bash
curl https://exp.host/--/api/v2/push/getReceipts \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["notification-id-dari-response"]
  }'
```

---

## 📚 Referensi

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Laravel Broadcasting](https://laravel.com/docs/broadcasting)

---

## ⚠️ Catatan Penting

1. **Token Expiry**: Token Expo bisa expired, handle error dan minta user login ulang
2. **Rate Limiting**: Expo membatasi 600 notifikasi/menit per project
3. **iOS**: Perlu Apple Push Notification certificate (APNs)
4. **Android**: Sudah tercover dengan Firebase FCM (google-services.json)
5. **Privacy**: Jangan kirim data sensitif di notifikasi body

---

**Dibuat oleh**: Frontend Team  
**Tanggal**: 11 Desember 2025  
**Status**: ✅ Frontend sudah siap, menunggu implementasi backend
