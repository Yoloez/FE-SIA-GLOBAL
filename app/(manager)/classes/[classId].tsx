import SharedClassDetail from "@shared/[classId].shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ManagerClassDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const classId = params.classId as string;

  return (
    <SharedClassDetail
      viewMode="manager"
      classId={classId}
      onBack={() => router.back()}
      onNavigateAssignMember={(role: string) => {
        router.push({
          pathname: "/(manager)/classes/assign-member",
          params: { classId, role },
        });
      }}
    />
  );
}
