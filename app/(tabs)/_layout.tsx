import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import TabBarButton from "../../components/TabBarButton"; // Sesuaikan path jika perlu

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, // Tampilkan label untuk tab lain
        tabBarStyle: {
          position: "absolute",
          left: 1,
          right: 1,
          bottom: 0, // Pastikan di bottom
          elevation: 0,
          backgroundColor: "white",
          borderRadius: 0,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          marginVertical: "auto",
          borderColor: "transparent",
          height: 100, // Tingkatkan height
          // Tambahkan padding untuk menghindari area navigasi
          paddingBottom: Platform.OS === "android" ? 65 : 25,
          paddingTop: 5,
        },
      }}
    >
      {/* Tab 1 */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />

      {/* === TAB PRESENSI (DI TENGAH) === */}
      <Tabs.Screen
        name="presensi"
        options={{
          // Sembunyikan title di header
          title: "Presensi",
          // Sembunyikan label di bawah ikon
          tabBarShowLabel: false,
          // Atur ikon agar kontras
          tabBarIcon: ({ focused }) => <Ionicons name="qr-code-outline" color={"#fff"} size={30} />,
          // Gunakan komponen custom sebagai tombol
          tabBarButton: (props) => <TabBarButton {...props} />,
        }}
      />

      {/* Tab 5 */}
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
