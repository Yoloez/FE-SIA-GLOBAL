// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabBarButton from "../../components/TabBarButton";

// --- Definisikan Warna ---
const TAB_BAR_BACKGROUND = "#015023";
const ACTIVE_ICON_BG = "#FACC15"; // Warna kuning untuk background ikon aktif
const INACTIVE_ICON_BG = "#FEFBEA"; // Warna krem untuk background ikon non-aktif
const ICON_COLOR = "#B48F2A"; // Warna gold untuk ikon di dalam lingkaran

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Sembunyikan semua label
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderColor: "#DABC4E",
          elevation: 0, // Hapus shadow di Android
          borderTopWidth: 0, // Hapus border di iOS
          backgroundColor: TAB_BAR_BACKGROUND,
          height: 65 + insets.bottom, // Tambahkan safe area bottom
          paddingBottom: insets.bottom, // Padding untuk area navigasi Android
          paddingTop: 10, // Sedikit padding atas untuk estetika
        },
      }}
    >
      {/* Tab Dashboard (Kiri) */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: focused ? ACTIVE_ICON_BG : INACTIVE_ICON_BG, borderColor: focused ? "white" : "#DABC4E" }]}>
                <Ionicons name="home" size={24} color={ICON_COLOR} />
              </View>
            </View>
          ),
        }}
      />

      {/* Tab Presensi (Tengah - Kustom) */}
      <Tabs.Screen
        name="presensi"
        options={{
          tabBarIcon: ({ focused }) => <Ionicons name="qr-code" size={30} color={ICON_COLOR} />,
          tabBarButton: (props) => (
            <TabBarButton
              {...props}
              bgColor={INACTIVE_ICON_BG} // Kirim warna background ke tombol kustom
            />
          ),
        }}
      />

      {/* Tab Profil (Kanan) */}
      <Tabs.Screen
        name="ProfilMahasiswa"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: focused ? ACTIVE_ICON_BG : INACTIVE_ICON_BG }, { borderColor: focused ? "white" : "#DABC4E" }]}>
                <Ionicons name="person" size={24} color={ICON_COLOR} />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    borderWidth: 2,
    width: 50,
    borderColor: "#DABC4E",
    height: 50,
    borderRadius: 25, // Setengah dari width/height
    alignItems: "center",
    justifyContent: "center",
  },
});
