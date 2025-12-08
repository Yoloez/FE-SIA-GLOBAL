import { Stack, useRouter } from "expo-router";
import React from "react";
import SharedListSubjects from "@shared/ListSubjects.shared";

export default function ManagerListSubjectsScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Daftar Mata Kuliah",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedListSubjects
        viewMode="manager"
        onAddSubject={() => router.push("/(manager)/AddSubject")}
        onEditSubject={(subjectData) =>
          router.push({
            pathname: "/(manager)/EditSubject",
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
    </>
  );
}
