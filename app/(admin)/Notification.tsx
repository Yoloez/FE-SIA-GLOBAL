import SharedNotification from "@shared/Notification.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminNotificationScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedNotification viewMode="admin" onBack={() => router.back()} />
    </>
  );
}
