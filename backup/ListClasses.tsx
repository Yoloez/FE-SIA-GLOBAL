import SharedListClasses from "@shared/ListClasses.shared";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function ManagerListClassesScreen() {
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
        viewMode="manager"
        onAddClass={() => router.push("/(manager)/AddClasses")}
        onEditClass={(classData) =>
          router.push({
            pathname: "/(manager)/EditClasses",
            params: classData,
          })
        }
      />
    </>
  );
}
