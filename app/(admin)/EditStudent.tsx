import SharedEditStudent from "@shared/EditStudent.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function AdminEditStudentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Mahasiswa",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedEditStudent
        viewMode="admin"
        studentId={params.id as string}
        initialData={{
          full_name: params.full_name as string,
          nim: params.nim as string,
          email: params.email as string,
          program: params.program as string,
          image: params.image as string | undefined,
        }}
        onBack={() => router.back()}
        onSuccess={() => router.back()}
      />
    </>
  );
}
