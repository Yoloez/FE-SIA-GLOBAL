import { Stack } from "expo-router";
import React from "react";

export default function ChatLayout() {
  // Navigator ini akan mengatur semua layar di dalam folder (chat),
  // memberikan header dan tombol kembali secara otomatis.
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Daftar Pesan" }} />
      <Stack.Screen name="[conversationId]" options={{ title: "Chat" }} />
    </Stack>
  );
}
