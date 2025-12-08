import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="classes" options={{ headerShown: false }} />
      <Stack.Screen name="lecturers" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: false }} />
      <Stack.Screen name="managers" options={{ headerShown: false }} />
      <Stack.Screen name="subjects" options={{ headerShown: false }} />
      <Stack.Screen name="Notification" options={{ headerShown: false }} />
    </Stack>
  );
}
