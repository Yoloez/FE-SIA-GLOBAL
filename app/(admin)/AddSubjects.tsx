import SharedAddSubjects from "@shared/AddSubjects.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminAddSubjectsScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAddSubjects viewMode="admin" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
