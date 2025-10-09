import { Slot, SplashScreen, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Mencegah splash screen bawaan untuk hilang secara otomatis.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Efek ini akan berjalan HANYA setelah status login selesai dimuat.
    if (isLoading) {
      return; // Jangan lakukan apa-apa jika masih loading
    }

    const inApp = segments[0] !== "(auth)";

    if (isLoggedIn && user) {
      // --- LANGKAH DEBUGGING PENTING ---
      // Baris ini akan mencetak peran pengguna ke terminal Metro Anda.
      // Ini akan memberi tahu kita nilai sebenarnya dari user.role.
      console.log("Checking role for redirection. User role is:", user.role);
      // --------------------------------

      // Jika pengguna sudah login tapi berada di halaman auth, paksa keluar.
      // Atau jika pengguna berada di halaman utama (root) setelah login.
      if (!inApp) {
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
            // Selalu sediakan fallback jika peran tidak dikenali
            console.log("Peran tidak dikenali, mengarahkan ke default.");
            router.replace("/(tabs)/");
            break;
        }
      }
    } else if (!isLoggedIn) {
      // Jika pengguna belum login, paksa mereka ke grup (auth)
      // Ini akan otomatis mengarah ke /login jika itu satu-satunya halaman
      router.replace("/(auth)/login");
    }

    // Setelah semua logika navigasi selesai, baru sembunyikan splash screen.
    SplashScreen.hideAsync();
  }, [isLoading, user, isLoggedIn, router]); // Dependensi yang lebih sederhana

  // Selama loading, kita tidak merender apa-apa (splash screen masih terlihat).
  if (isLoading) {
    return null;
  }

  // <Slot /> akan merender halaman yang benar.
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
