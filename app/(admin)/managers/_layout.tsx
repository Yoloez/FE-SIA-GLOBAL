import { Stack } from "expo-router";

export default function AdminManagersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: true, title: "List Managers" }} />
      <Stack.Screen name="add" options={{ headerShown: true }} />
      <Stack.Screen name="edit" options={{ headerShown: true }} />
    </Stack>
  );
}
