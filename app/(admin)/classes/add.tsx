import SharedAddClasses from "@shared/AddClasses.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminAddClassesScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAddClasses viewMode="admin" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
