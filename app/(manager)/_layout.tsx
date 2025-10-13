import { Stack } from "expo-router";
import React from "react";

export default function ManagerLayout() {
  // Navigator ini akan menyediakan header dan tombol kembali
  // untuk semua halaman di dalam grup (manager)
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Manager Dashboard" }} />
      <Stack.Screen name="CreateClasses" options={{ title: "Buat Kelas Baru", presentation: "modal" }} />
      <Stack.Screen name="[classId]" options={{ title: "Detail Kelas" }} />
      <Stack.Screen name="AssignMember" options={{ title: "Tambah Anggota", presentation: "modal" }} />
      <Stack.Screen name="CreateSubjects" options={{ title: "Buat Mata Kuliah" }} />
      <Stack.Screen name="CreateLecturer" options={{ title: "Tambah Dosen" }} />
    </Stack>
  );
}
