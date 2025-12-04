import { Slot, SplashScreen, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { FontProvider } from "../context/FontContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
    const inSharedRoute = segments[0] === "chat" || segments[0] === "modal"; // Routes yang bisa diakses semua role

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
        router.replace(`/${targetGroup}/`);
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
    <FontProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </FontProvider>
  );
}
