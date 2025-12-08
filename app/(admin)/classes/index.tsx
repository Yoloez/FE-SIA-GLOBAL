import SharedListClasses from "@shared/ListClasses.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function AdminListClassesScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Daftar Kelas",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <SharedListClasses
        viewMode="admin"
        onAddClass={() => router.push("/classes/add")}
        onEditClass={(classData) =>
          router.push({
            pathname: "/classes/edit",
            params: classData,
          })
        }
      />
    </>
  );
}
