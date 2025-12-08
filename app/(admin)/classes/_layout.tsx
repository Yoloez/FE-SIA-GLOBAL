import { Stack } from "expo-router";

export default function AdminClassesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="add" options={{ headerShown: true }} />
      <Stack.Screen name="edit" options={{ headerShown: true }} />
      <Stack.Screen name="[classId]" options={{ headerShown: false }} />
      <Stack.Screen name="assign-member" options={{ headerShown: true }} />
    </Stack>
  );
}
