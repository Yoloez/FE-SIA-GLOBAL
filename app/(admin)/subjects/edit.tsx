import SharedEditSubject from "@shared/EditSubject.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function AdminEditSubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Mata Kuliah",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedEditSubject
        viewMode="admin"
        subjectId={params.id as string}
        initialData={{
          name_subject: params.name as string,
          code_subject: params.code as string,
          sks: params.sks as string,
        }}
        onBack={() => router.back()}
        onSuccess={() => router.back()}
      />
    </>
  );
}
