import SharedClassDetail from "@shared/[classId].shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerClassDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const classId = params.classId as string;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedClassDetail
        viewMode="manager"
        classId={classId}
        onBack={() => router.back()}
        onNavigateAssignMember={(role: string) => {
          router.push({
            pathname: "/(manager)/AssignMember",
            params: { classId, role },
          });
        }}
      />
    </>
  );
}
