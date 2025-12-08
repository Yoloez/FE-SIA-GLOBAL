import SharedListStudent from "@shared/ListStudent.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminListStudentScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Daftar Mahasiswa",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedListStudent
        viewMode="admin"
        onAddStudent={() => router.push("/students/add")}
        onEditStudent={(studentData) =>
          router.push({
            pathname: "/students/edit",
            params: studentData,
          })
        }
      />
    </>
  );
}
