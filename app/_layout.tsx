import { Slot, SplashScreen, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Mencegah splash screen bawaan untuk hilang secara otomatis.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Jangan lakukan apa-apa jika context masih memuat data sesi.
    if (isLoading) {
      return;
    }

    // Kondisi ini akan dipanggil SETELAH login berhasil atau saat refresh
    if (isLoggedIn && user) {
      console.log("User is logged in. Redirecting based on role:", user.role);
      switch (user.role) {
        case "student":
          router.replace("/(tabs)/");
          break;
        case "dosen":
          router.replace("/(dosen)/");
          break;
        case "admin":
          router.replace("/(admin)/");
          break;
        case "manager":
          router.replace("/(manager)/");
          break;
        default:
          console.log("Peran tidak dikenali, mengarahkan ke default.");
          router.replace("/(tabs)/");
          break;
      }
    } else if (!isLoggedIn) {
      // Kondisi ini akan dipanggil jika tidak ada sesi (saat app start atau setelah logout)
      console.log("User is not logged in. Redirecting to login.");
      router.replace("/(auth)/login");
    }

    // Sembunyikan splash screen setelah logika navigasi selesai.
    SplashScreen.hideAsync();

    // --- INI PERBAIKANNYA ---
    // Hapus `router` dari dependency array untuk memutus infinite loop.
    // Efek ini sekarang hanya akan berjalan jika status otentikasi pengguna berubah.
  }, [isLoading, user, isLoggedIn]);

  // Selama loading, kita tidak merender apa-apa (splash screen masih terlihat).
  if (isLoading) {
    return null;
  }

  // <Slot /> akan merender halaman yang benar setelah pengalihan selesai.
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
