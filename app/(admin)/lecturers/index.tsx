import SharedListLecturer from "@shared/ListLecturer.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminListLecturerScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Daftar Dosen",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedListLecturer
        viewMode="admin"
        onAddLecturer={() => router.push("/lecturers/add")}
        onEditLecturer={(lecturerData) =>
          router.push({
            pathname: "/lecturers/edit",
            params: {
              id: lecturerData.id,
              name: lecturerData.name,
              employee_id_number: lecturerData.nip,
              email: lecturerData.email,
              profile_image: lecturerData.image,
            },
          })
        }
        onBack={() => router.back()}
      />
    </>
  );
}
