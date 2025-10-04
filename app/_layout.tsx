import { Slot, SplashScreen, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";

// 1. Mencegah splash screen bawaan untuk hilang secara otomatis.
// Kita akan mengontrolnya secara manual.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 2. Efek ini akan berjalan HANYA setelah status login selesai dimuat (`isLoading` menjadi false).
    if (!isLoading) {
      const inAuthGroup = segments[0] === "(auth)";

      // Jika pengguna sudah login TAPI masih berada di halaman login/auth,
      // arahkan mereka ke dashboard yang sesuai.
      if (isLoggedIn && inAuthGroup) {
        switch (user?.role) {
          case "mahasiswa":
            router.replace("/(tabs)/");
            break;
          case "dosen":
            // Nanti, arahkan ke rute dosen
            // router.replace("/(dosen)/");
            break;
          default:
            router.replace("/(tabs)/"); // Fallback
            break;
        }
      }

      // Jika pengguna BELUM login dan TIDAK sedang di halaman auth,
      // paksa mereka kembali ke halaman login.
      else if (!isLoggedIn && !inAuthGroup) {
        router.replace("/(auth)/login");
      }

      // 3. Setelah semua logika navigasi selesai, baru sembunyikan splash screen.
      SplashScreen.hideAsync();
    }
  }, [isLoading, user, isLoggedIn, segments, router]); // Jalankan efek ini jika state berubah

  // 4. Selama loading, kita tidak merender apa-apa (splash screen masih terlihat).
  if (isLoading) {
    return null;
  }

  // Setelah selesai, <Slot /> akan merender halaman yang benar berdasarkan
  // hasil navigasi dari useEffect di atas. Ini memenuhi aturan Expo Router.
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
