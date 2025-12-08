import SharedAssignMember from "@shared/AssignMember.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerAssignMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAssignMember viewMode="manager" classId={params.classId as string} role={params.role as any} onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
