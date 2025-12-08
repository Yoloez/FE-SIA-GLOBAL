import SharedAssignMember from "@shared/AssignMember.shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerAssignMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return <SharedAssignMember viewMode="manager" classId={params.classId as string} role={params.role as any} onBack={() => router.back()} onSuccess={() => router.back()} />;
}
