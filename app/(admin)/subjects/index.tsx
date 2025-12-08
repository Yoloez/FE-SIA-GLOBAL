import SharedListSubjects from "@shared/ListSubjects.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminListSubjectsScreen() {
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
        viewMode="admin"
        onAddSubject={() => router.push("/subjects/add")}
        onEditSubject={(subjectData) =>
          router.push({
            pathname: "/subjects/edit",
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
