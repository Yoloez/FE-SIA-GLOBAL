import { Stack } from "expo-router";
import React from "react";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
        }}
      />
      <Stack.Screen
        name="[conversationId]"
        options={{
          title: "Chat",
        }}
      />
    </Stack>
  );
}
