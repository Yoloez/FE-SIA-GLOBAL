import SharedAssignMember from "@shared/AssignMember.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function AdminAssignMemberScreen() {
  const router = useRouter();
  const { classId, role } = useLocalSearchParams<{
    classId: string;
    role: "dosen" | "mahasiswa";
  }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedAssignMember viewMode="admin" classId={classId!} role={role!} onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
