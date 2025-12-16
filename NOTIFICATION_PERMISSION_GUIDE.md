# 🔔 Notification Permission Guide

## Overview

Aplikasi ini akan meminta izin notifikasi kepada user setelah berhasil login, untuk semua role (Dosen, Mahasiswa, Manager, Admin).

## Flow Permission

### 1. **Setelah Login Berhasil**

- Sistem otomatis mengecek status permission notifikasi
- Jika belum granted, akan muncul CustomAlert dengan penjelasan

### 2. **CustomAlert Permission**

Dialog menjelaskan manfaat notifikasi:

- 📅 Jadwal kuliah dan perubahan
- 📢 Pengumuman akademik
- ✅ Reminder presensi
- 💬 Pesan dari dosen/mahasiswa

User dapat memilih:

- **"Nanti Saja"** - Skip permission (bisa diminta lagi nanti)
- **"Izinkan"** - Lanjut ke system permission dialog

### 3. **System Permission Dialog**

- Android/iOS native permission dialog muncul
- User grant atau deny permission di level sistem

### 4. **Register Push Token**

Jika permission granted:

- Generate Expo Push Token
- Simpan token di AsyncStorage
- Kirim token ke backend `/device-tokens/register` dengan info:
  - `expo_push_token`
  - `device_id`
  - `device_name`
  - `platform` (android/ios)

### 5. **Success Message**

Setelah berhasil, muncul alert konfirmasi:

- "✅ Notifikasi Aktif"
- User dapat langsung menggunakan aplikasi

## Implementation Details

### File: `app/(auth)/login.tsx`

#### Functions:

1. **`registerPushToken()`**
   - Get Expo Push Token
   - Store locally
   - Send to backend

2. **`requestNotificationPermissionIfNeeded()`**
   - Check current permission status
   - Show explanation dialog
   - Request system permission
   - Handle success/failure

3. **`handleLogin()`**
   - Login user
   - Check permission status
   - Trigger permission request if needed

### Storage Keys:

- `notifications_permission_status` - Permission status (granted/denied)
- `expo_push_token` - Expo push token string

## Testing

### Test Permission Flow:

1. Clear app data untuk reset permission
2. Login dengan kredensial valid
3. Verify alert muncul dengan teks yang benar
4. Test kedua button (Nanti Saja & Izinkan)
5. Verify token terkirim ke backend

### Debug Logs:

Enable console logs untuk tracking:

- `📱 Current notification permission status`
- `🔑 Requesting notification permission...`
- `✅ Permission granted, registering push token...`
- `📤 Registering push token to backend...`
- `✅ Push token successfully registered to backend`

## Backend Requirements

### Endpoint: `POST /device-tokens/register`

Request body:

```json
{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_id": "string",
  "device_name": "string",
  "platform": "android" | "ios"
}
```

Response should be 200 OK on success.

## User Experience

### Best Practices:

✅ Clear explanation why notification is needed
✅ Easy to understand benefits
✅ Two-step permission (explanation + system)
✅ Can skip and be asked again later
✅ Success confirmation message
✅ Non-blocking - app still works if denied

### UX Flow:

```
Login Success → Check Permission → Show Alert → Request System Permission → Register Token → Success Message → Navigate to Home
```

## Troubleshooting

### Permission tidak muncul:

- Check `Notifications.getPermissionsAsync()` status
- Verify AsyncStorage keys
- Clear app data & test again

### Token tidak terkirim ke backend:

- Check network connection
- Verify backend endpoint available
- Check authentication token valid
- Review backend logs

### Push notification tidak diterima:

- Verify token registered correctly
- Check backend notification sending logic
- Verify FCM/APNs configuration
- Test with Expo push notification tool

## Related Files

- `app/(auth)/login.tsx` - Main implementation
- `hooks/useNotifications.ts` - Notification hooks
- `utils/notificationService.ts` - Notification utilities
- `components/CustomAlert.tsx` - Custom alert component

## Notes

- Permission prompt akan muncul setiap kali login jika belum granted
- Token akan di-refresh setiap kali user login dengan permission granted
- Jika backend registration gagal, token tetap tersimpan lokal untuk retry nanti
