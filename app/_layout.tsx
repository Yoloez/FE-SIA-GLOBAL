import { Slot, SplashScreen, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { FontProvider } from "../context/FontContext";
import { LecturerDataProvider } from "../context/LecturerDataContext";
import { StudentDataProvider } from "../context/StudentDataContext";
import { useNotifications } from "../hooks/useNotifications";

SplashScreen.preventAutoHideAsync();

// Global Error Handler
if (typeof ErrorUtils !== "undefined") {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error("========================================");
    console.error("[GLOBAL ERROR HANDLER] Unhandled Error Detected!");
    console.error("[GLOBAL ERROR HANDLER] Is Fatal:", isFatal);
    console.error("[GLOBAL ERROR HANDLER] Error:", error);
    console.error("[GLOBAL ERROR HANDLER] Error Name:", error.name);
    console.error("[GLOBAL ERROR HANDLER] Error Message:", error.message);
    console.error("[GLOBAL ERROR HANDLER] Error Stack:", error.stack);
    console.error("[GLOBAL ERROR HANDLER] Timestamp:", new Date().toISOString());
    console.error("========================================");

    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

function RootLayoutNav() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize notifications for logged-in user
  // This handles push notification registration and tap navigation
  // Individual screens still have their own Echo listeners for real-time updates
  useNotifications(user?.id_user_si);

  // --- INI PERBAIKANNYA ---
  // State baru untuk memastikan kita tidak merender <Slot> terlalu cepat
  const [isRouteChecked, setIsRouteChecked] = useState(false);

  useEffect(() => {
    console.log("[ROUTE] State:", { isLoggedIn, role: user?.role, segment: segments[0], isAuthLoading });

    // 1. Jangan lakukan apa-apa jika AuthContext masih memuat sesi
    if (isAuthLoading) {
      console.log("[ROUTE] Menunggu AuthContext selesai loading...");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inSharedRoute = segments[0] === "chat"; // Routes yang bisa diakses semua role

    if (isLoggedIn && user) {
      // PENGGUNA SUDAH LOGIN
      let targetGroup: string;
      switch (user.role) {
        case "mahasiswa":
          targetGroup = "(mahasiswa)";
          break;
        case "dosen":
          targetGroup = "(dosen)";
          break;
        case "admin":
          targetGroup = "(admin)";
          break;
        case "manager":
          targetGroup = "(manager)";
          break;
        default:
          targetGroup = "(tabs)";
          break;
      }

      console.log("[ROUTE] User logged in, target group:", targetGroup);

      // 2. Cek apakah pengguna sudah berada di grup yang benar ATAU di shared route
      if (inSharedRoute) {
        // Izinkan akses ke shared routes seperti /chat
        console.log("[ROUTE] Akses shared route diizinkan");
        setIsRouteChecked(true);
      } else if (segments[0] !== targetGroup) {
        // Jika belum di grup yang benar dan bukan shared route, pindahkan mereka
        console.log("[ROUTE] Redirect ke:", `/${targetGroup}/`);
        router.replace(`/${targetGroup}/` as any);
      } else {
        // Jika sudah di grup yang benar, izinkan rendering
        console.log("[ROUTE] Sudah di grup yang benar");
        setIsRouteChecked(true);
      }
    } else if (!isLoggedIn) {
      // PENGGUNA BELUM LOGIN
      console.log("[ROUTE] User tidak login");

      // 3. Cek apakah mereka sudah di grup (auth)
      if (!inAuthGroup) {
        // Jika belum, pindahkan mereka ke login
        console.log("[ROUTE] Redirect ke login");
        router.replace("/(auth)/login");
      } else {
        // Jika sudah di auth group, izinkan rendering
        console.log("[ROUTE] Sudah di halaman auth");
        setIsRouteChecked(true);
      }
    }
  }, [isAuthLoading, user, isLoggedIn, segments, router]);

  useEffect(() => {
    // 4. Sembunyikan Splash Screen HANYA SETELAH rute diverifikasi
    if (isRouteChecked) {
      SplashScreen.hideAsync();
    }
  }, [isRouteChecked]);

  // 5. JANGAN RENDER <Slot> sampai kita yakin rutenya sudah benar
  if (!isRouteChecked) {
    return null;
  }

  // <Slot /> sekarang aman untuk dirender
  return <Slot />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <FontProvider>
        <AuthProvider>
          <StudentDataProvider>
            <LecturerDataProvider>
              <RootLayoutNav />
            </LecturerDataProvider>
          </StudentDataProvider>
        </AuthProvider>
      </FontProvider>
    </ErrorBoundary>
  );
}
