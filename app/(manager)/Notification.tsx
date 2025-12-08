import SharedNotification from "@shared/Notification.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerNotificationScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: "Broadcast Announcement",
          headerBackTitle: "Back",
        }}
      />
      <SharedNotification viewMode="manager" onBack={() => router.back()} />
    </>
  );
}
