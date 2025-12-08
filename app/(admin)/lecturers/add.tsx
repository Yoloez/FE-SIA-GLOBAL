import SharedAddLecturer from "@shared/AddLecturer.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminAddLecturerScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Tambah Dosen",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerTitleAlign: "left",
        }}
      />
      <SharedAddLecturer viewMode="admin" onBack={() => router.back()} onSuccess={() => router.back()} />
    </>
  );
}
