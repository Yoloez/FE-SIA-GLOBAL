import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="AddManager" options={{ headerShown: true }} />
      <Stack.Screen name="ListManager" options={{ headerShown: true }} />
      <Stack.Screen name="CreateClasses" options={{ title: "Buat Kelas Baru", presentation: "modal" }} />
      <Stack.Screen name="[classId]" options={{ title: "Detail Kelas" }} />
      <Stack.Screen name="AssignMember" options={{ title: "Tambah Anggota", presentation: "modal" }} />
      <Stack.Screen name="CreateSubjects" options={{ title: "Buat Mata Kuliah" }} />
      <Stack.Screen name="CreateLecturer" options={{ title: "Tambah Dosen" }} />
      <Stack.Screen name="CreateStudent" options={{ title: "Tambah Mahasiswa" }} />
    </Stack>
  );
}
