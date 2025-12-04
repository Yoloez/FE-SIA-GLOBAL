import { Stack } from "expo-router";

export default function PresensiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="detail" />
    </Stack>
  );
}
