import SharedListStudent from "@shared/ListStudent.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerListStudentScreen() {
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
        viewMode="manager"
        onAddStudent={() => router.push("/(manager)/AddStudent")}
        onEditStudent={(studentData) =>
          router.push({
            pathname: "/(manager)/EditStudent",
            params: studentData,
          })
        }
      />
    </>
  );
}
