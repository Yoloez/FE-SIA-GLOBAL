import SharedEditLecturer from "@shared/EditLecturer.shared";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function AdminEditLecturerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Dosen",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedEditLecturer
        viewMode="admin"
        lecturerId={params.id as string}
        initialData={{
          name: params.name as string,
          employee_id_number: params.employee_id_number as string,
          email: params.email as string,
          profile_image: params.profile_image as string | undefined,
        }}
        onBack={() => router.back()}
        onSuccess={() => router.back()}
      />
    </>
  );
}
