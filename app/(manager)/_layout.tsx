import { Stack } from "expo-router";
import React from "react";

export default function ManagerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Manager Dashboard", headerShown: false }} />

      {/* Classes Routes */}
      <Stack.Screen name="classes" options={{ headerShown: false }} />

      {/* Lecturers Routes */}
      <Stack.Screen name="lecturers" options={{ headerShown: false }} />

      {/* Students Routes */}
      <Stack.Screen name="students" options={{ headerShown: false }} />

      {/* Subjects Routes */}
      <Stack.Screen name="subjects" options={{ headerShown: false }} />

      {/* Profile Routes */}
      <Stack.Screen name="Profil" options={{ title: "Profil Manager", headerShown: false }} />
      <Stack.Screen name="EditProfil" options={{ title: "Edit Profil Manager", headerShown: false }} />

      {/* Notification */}
      <Stack.Screen name="Notification" options={{ title: "Notifikasi", headerShown: false }} />
    </Stack>
  );
}
