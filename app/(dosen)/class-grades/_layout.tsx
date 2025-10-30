import { Stack } from "expo-router";

export default function ClassGradesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // atau true kalau mau ada back button
      }}
    />
  );
}
