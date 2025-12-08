import { Stack } from "expo-router";
import React from "react";

export default function SubjectsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Daftar Mata Kuliah",
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
