// app/_layout.tsx

import { Redirect, Stack, usePathname } from "expo-router"; // 1. Impor usePathname
import { AuthProvider, useAuth } from "../context/AuthContext";
// ... import lainnya biarkan saja ...
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "react-native";

function RootLayoutNav() {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname(); // 2. Dapatkan path URL saat ini
  const colorScheme = useColorScheme();

  // 3. Logika Penjaga yang lebih pintar:
  // Redirect HANYA JIKA:
  // - Belum login (isLoggedIn === false)
  // - DAN TIDAK sedang di halaman login (pathname !== '/login')
  if (!isLoggedIn && pathname !== "/login") {
    return <Redirect href="/login" />;
  }

  // Jika sudah login, atau jika memang sedang di halaman login,
  // tampilkan navigator seperti biasa.
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" translucent={false} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="Schedule" // Cocokkan dengan nama file: Schedule.tsx
          options={{
            title: "Jadwal Anda",
            headerStyle: {
              backgroundColor: "#015023", // Warna HIJAU
            },
            headerTintColor: "#ffffff", // Warna teks & tombol kembali menjadi PUTIH
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      </Stack>
      {/* </SafeAreaView> */}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Biarkan provider lain seperti SafeAreaProvider jika ada
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
