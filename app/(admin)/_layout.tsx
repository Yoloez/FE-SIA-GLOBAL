import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="AddManager" options={{ headerShown: true }} />
      <Stack.Screen name="ListManager" options={{ headerShown: true }} />
      <Stack.Screen name="ListClasses" options={{ title: "Buat Kelas Baru", presentation: "modal" }} />
      <Stack.Screen name="[classId]" options={{ title: "Detail Kelas" }} />
      <Stack.Screen name="AssignMember" options={{ title: "Tambah Anggota", presentation: "modal" }} />
      <Stack.Screen name="ListSubjects" options={{ title: "Buat Mata Kuliah" }} />
      <Stack.Screen name="ListLecturer" options={{ title: "Tambah Dosen" }} />
      <Stack.Screen name="ListStudent" options={{ title: "Tambah Mahasiswa" }} />
      <Stack.Screen name="EditClasses" options={{ title: "Edit kelas" }} />
      <Stack.Screen
        name="EditSubject"
        options={{
          title: "Edit Subject",
          headerStyle: { backgroundColor: "#1a5c3a" },
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="EditStudent"
        options={{
          title: "Edit Mahasiswa",
          headerStyle: { backgroundColor: "#1a5c3a" },
          headerTintColor: "#fff",
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}
