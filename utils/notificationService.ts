import api from "@/api/axios";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: "chat" | "announcement";
  id_conversation?: number;
  id_message?: number;
  id_announcement?: number;
  title: string;
  message: string;
  sender?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log("⚠️ Push notifications hanya berfungsi di device fisik");
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("❌ Permission untuk notifikasi ditolak");
        return null;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Ganti dengan project ID dari app.json
      });

      this.expoPushToken = token.data;
      console.log("🔑 Expo Push Token:", this.expoPushToken);

      // Set notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#015023",
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("chat", {
          name: "Pesan Chat",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0EA5E9",
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("announcement", {
          name: "Pengumuman",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F59E0B",
          sound: "default",
        });
      }

      // Save token to backend
      await this.sendTokenToBackend(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error("❌ Error registering push notifications:", error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post("/notifications/register-device", {
        device_token: token,
        device_type: Platform.OS,
      });
      console.log("✅ Device token berhasil disimpan ke backend");
    } catch (error) {
      console.error("❌ Gagal menyimpan device token:", error);
    }
  }

  /**
   * Show local notification (for testing or when receiving from Echo)
   */
  async showLocalNotification(data: NotificationData): Promise<void> {
    try {
      const channelId = data.type === "chat" ? "chat" : "announcement";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      console.log("📬 Local notification displayed");
    } catch (error) {
      console.error("❌ Error showing local notification:", error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log("🧹 All notifications cleared");
    } catch (error) {
      console.error("❌ Error clearing notifications:", error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error("❌ Error getting badge count:", error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("❌ Error setting badge count:", error);
    }
  }

  /**
   * Remove device token from backend (on logout)
   */
  async removeDeviceToken(): Promise<void> {
    try {
      if (this.expoPushToken) {
        await api.delete("/notifications/remove-device", {
          data: { device_token: this.expoPushToken },
        });
        console.log("✅ Device token berhasil dihapus dari backend");
        this.expoPushToken = null;
      }
    } catch (error) {
      console.error("❌ Gagal menghapus device token:", error);
    }
  }
}

export default new NotificationService();
