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
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
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
    const token = await notificationService.registerForPushNotifications();
    setExpoPushToken(token);
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
    const channelName = `private-user.${userId}`;
    console.log(`🎧 Subscribing to notifications channel: ${channelName}`);

    echo
      .private(channelName)
      .listen(".notification.sent", (event: any) => {
        console.log("🔔 New notification received via Echo:", event);

        const notificationData: NotificationData = {
          type: event.type || "announcement",
          id_conversation: event.metadata?.id_conversation,
          id_message: event.metadata?.id_message,
          id_announcement: event.metadata?.id_announcement,
          title: event.title || "Notifikasi Baru",
          message: event.message || "",
          sender: event.sender || "System",
        };

        // Show local notification
        notificationService.showLocalNotification(notificationData);

        // Update badge count
        updateBadgeCount();
      })
      .error((error: any) => {
        console.error(`❌ Error subscribing to ${channelName}:`, error);
      });
  };

  const unsubscribeFromUserNotifications = (userId: number) => {
    const channelName = `private-user.${userId}`;
    echo.leave(channelName);
    console.log(`👋 Unsubscribed from ${channelName}`);
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
