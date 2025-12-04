import { Stack } from "expo-router";
import React from "react";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#015023",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Chat List",
          // headerBackVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[conversationId]"
        options={{
          title: "Chat",
          headerBackVisible: true,
        }}
      />
    </Stack>
  );
}
