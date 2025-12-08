import SharedClassId from "@shared/[classId].shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function AdminClassIdScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();

  return (
    <>
      <SharedClassId
        viewMode="admin"
        classId={classId!}
        onBack={() => router.back()}
        onNavigateAssignMember={(role) =>
          router.push({
            pathname: "/classes/assign-member",
            params: { classId, role },
          })
        }
      />
    </>
  );
}
