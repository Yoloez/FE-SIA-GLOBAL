import SharedClassId from "@shared/[classId].shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function AdminClassIdScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SharedClassId
        viewMode="admin"
        classId={classId!}
        onBack={() => router.back()}
        onNavigateAssignMember={(role) =>
          router.push({
            pathname: "/(admin)/AssignMember",
            params: { classId, role },
          })
        }
      />
    </>
  );
}
