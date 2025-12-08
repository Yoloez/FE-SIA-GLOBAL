import { Stack } from "expo-router";
import React from "react";

export default function ClassesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Daftar Kelas",
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
        name="Edit Kelas"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[classId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="assign-member"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
