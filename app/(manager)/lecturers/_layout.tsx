import { Stack } from "expo-router";
import React from "react";

export default function LecturersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Daftar Dosen",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
