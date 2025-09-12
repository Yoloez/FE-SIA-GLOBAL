import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="presensi" options={{ title: "Presensi" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="futur" options={{ title: "Future" }} />
    </Tabs>
  );
}
