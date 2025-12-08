import SharedListLecturer from "@shared/ListLecturer.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerListLecturerScreen() {
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
        viewMode="manager"
        onAddLecturer={() => router.push("/(manager)/AddLecturer")}
        onEditLecturer={(lecturerData) =>
          router.push({
            pathname: "/(manager)/EditLecturer",
            params: {
              id: lecturerData.id,
              name: lecturerData.name,
              nip: lecturerData.nip,
              email: lecturerData.email,
              image: lecturerData.image,
            },
          })
        }
        onBack={() => router.back()}
      />
    </>
  );
}
