import SharedAddClasses from "@shared/AddClasses.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerAddClassesScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAddClasses viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
