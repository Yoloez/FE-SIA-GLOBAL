import echo from "@/api/echo";
import notificationService, { NotificationData } from "@/utils/notificationService";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useNotifications(userId?: number) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);
  const router = useRouter();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("📬 Notification received (foreground):", notification);
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped:", response);
      handleNotificationResponse(response.notification);
    });

    // Listen for app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      try {
        if (notificationListener.current && notificationListener.current.remove) {
          notificationListener.current.remove();
        }
        if (responseListener.current && responseListener.current.remove) {
          responseListener.current.remove();
        }
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      } catch (error) {
        console.error("⚠️ Error cleaning up notification listeners:", error);
      }
    };
  }, []);

  useEffect(() => {
    if (userId) {
      subscribeToUserNotifications(userId);
    }

    return () => {
      if (userId) {
        unsubscribeFromUserNotifications(userId);
      }
    };
  }, [userId]);

  const registerForPushNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      setExpoPushToken(token);
    } catch (error) {
      console.error("⚠️ Push notification registration failed:", error);
      // Continue without push notifications - local notifications will still work
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      console.log("📱 App came to foreground");
      // Clear badge when app is opened
      notificationService.setBadgeCount(0);
    }
    appState.current = nextAppState;
  };

  const subscribeToUserNotifications = (userId: number) => {
    const channelName = `user.${userId}`; // Changed from private-user to match notification screens
    console.log(`🎧 Subscribing to notifications channel: private-${channelName}`);

    echo
      .private(channelName)
      .listen(".NewNotification", (event: any) => {
        console.log("🔔 New notification received via Echo:", event);

        // Handle both direct notification and wrapped notification
        const notif = event.notification || event;

        const notificationData: NotificationData = {
          type: notif.type || "announcement",
          id_conversation: notif.metadata?.id_conversation,
          id_message: notif.metadata?.id_message,
          id_announcement: notif.metadata?.id_announcement,
          title: notif.title || "Notifikasi Baru",
          message: notif.message || "",
          sender: notif.sender || "System",
        };

        // Show local notification
        notificationService.showLocalNotification(notificationData);

        // Update badge count
        updateBadgeCount();
      })
      .error((error: any) => {
        console.error(`❌ Error subscribing to private-${channelName}:`, error);
      });
  };

  const unsubscribeFromUserNotifications = (userId: number) => {
    const channelName = `user.${userId}`;
    echo.leave(channelName);
    console.log(`👋 Unsubscribed from private-${channelName}`);
  };

  const handleNotificationResponse = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;

    if (data.type === "chat" && data.id_conversation) {
      // Navigate to chat conversation
      router.push(`/chat/${data.id_conversation}`);
    } else if (data.type === "announcement") {
      // Navigate to notification screen
      router.push("/(mahasiswa)/notification");
    }
  };

  const updateBadgeCount = async () => {
    try {
      const currentCount = await notificationService.getBadgeCount();
      await notificationService.setBadgeCount(currentCount + 1);
    } catch (error) {
      console.error("❌ Error updating badge count:", error);
    }
  };

  return {
    expoPushToken,
    notification,
  };
}
