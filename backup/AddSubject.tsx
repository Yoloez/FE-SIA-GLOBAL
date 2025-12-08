import SharedAddSubject from "@shared/AddSubjects.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerAddSubjectScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAddSubject viewMode="manager" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
