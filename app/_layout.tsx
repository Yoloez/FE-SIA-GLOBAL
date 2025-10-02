import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const colorScheme = useColorScheme();

  if (!isLoggedIn && pathname !== "/login" && pathname !== "/ForgotPassword") {
    return <Redirect href="/login" />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" translucent={false} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* === BARIS YANG DITAMBAHKAN === */}
        <Stack.Screen
          name="ForgotPassword" // Sesuaikan dengan nama file: ForgotPassword.tsx
          options={{
            presentation: "modal",
            title: "Lupa Password",
            headerTitleAlign: "center",

            headerShown: true,
            // sheetElevation: 100,
            headerStyle: { backgroundColor: "#015023" },
            headerTintColor: "#ffffff",

            headerTitleStyle: { fontWeight: "medium", fontFamily: "Urbanist_600SemiBold" },
          }}
        />
        {/* ============================== */}

        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="Schedule"
          options={{
            title: "Jadwal Anda",
            headerStyle: { backgroundColor: "#015023" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
