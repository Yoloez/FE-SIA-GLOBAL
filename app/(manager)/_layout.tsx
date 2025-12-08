import { Stack } from "expo-router";
import React from "react";

export default function ManagerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Manager Dashboard", headerShown: false }} />
      <Stack.Screen name="ListClasses" options={{ title: "Buat Kelas Baru", presentation: "modal" }} />
      <Stack.Screen name="[classId]" options={{ title: "Detail Kelas" }} />
      <Stack.Screen name="AssignMember" options={{ title: "Tambah Anggota", presentation: "modal" }} />
      <Stack.Screen name="ListSubjects" options={{ title: "Buat Mata Kuliah" }} />
      <Stack.Screen name="ListLecturer" options={{ title: "Tambah Dosen" }} />
      <Stack.Screen name="ListStudent" options={{ title: "Tambah Mahasiswa" }} />
      <Stack.Screen name="Profil" options={{ title: "Profil Manager", headerShown: false }} />
      <Stack.Screen name="EditProfil" options={{ title: "Edit Profil Manager", headerShown: false }} />
      <Stack.Screen name="EditSubject" options={{ title: "Edit Mata Kuliah", headerTintColor: "#fff", headerStyle: { backgroundColor: "#1a5c3a" }, headerTitleAlign: "center" }} />
    </Stack>
  );
}
