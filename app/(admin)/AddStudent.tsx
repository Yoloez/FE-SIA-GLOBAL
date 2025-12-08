import SharedAddStudent from "@shared/AddStudent.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminAddStudentScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAddStudent viewMode="admin" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
