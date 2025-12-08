import SharedAddLecturer from "@shared/AddLecturer.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerAddLecturerScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAddLecturer viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
