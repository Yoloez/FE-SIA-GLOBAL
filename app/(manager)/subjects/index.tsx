import { useRouter } from "expo-router";
import React from "react";
import SharedListSubjects from "@shared/ListSubjects.shared";

export default function ManagerListSubjectsScreen() {
  const router = useRouter();

  return (
    <SharedListSubjects
      viewMode="manager"
      onAddSubject={() => router.push("/(manager)/subjects/add")}
      onEditSubject={(subjectData) =>
        router.push({
          pathname: "/(manager)/subjects/edit",
          params: {
            id: subjectData.id,
            name: subjectData.name,
            code: subjectData.code,
            sks: subjectData.sks.toString(),
          },
        })
      }
      onBack={() => router.back()}
    />
  );
}
