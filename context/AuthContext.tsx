import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// Tipe data untuk User, pastikan sesuai
interface User {
  id: number;
  name: string;
  email: string;
  role: "mahasiswa" | "dosen" | "admin" | "manager" | "student" | "applicant" | null;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      console.log("========================================");
      console.log("[INVESTIGASI] App Start: Mencoba memuat data sesi...");
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        console.log("[INVESTIGASI] Token dari storage:", storedToken ? "Ditemukan" : "Kosong");
        console.log("[INVESTIGASI] Data user dari storage:", storedUserData ? "Ditemukan" : "Kosong");

        if (storedToken && storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);
          setToken(storedToken);
          console.log("[INVESTIGASI] Sesi berhasil dimuat untuk pengguna:", parsedUser.name);
        } else {
          console.log("[INVESTIGASI] Tidak ada sesi aktif yang ditemukan.");
        }
      } catch (e) {
        console.error("[INVESTIGASI] GAGAL memuat data dari storage", e);
      } finally {
        setIsLoading(false);
        console.log("========================================");
      }
    };

    loadUserData();
  }, []);

  const login = async (userData: User, authToken: string) => {
    console.log("========================================");
    console.log("[INVESTIGASI] Login: Mencoba menyimpan data sesi...");
    try {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem("userToken", authToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      console.log("[INVESTIGASI] Data sesi untuk", userData.name, "berhasil disimpan.");
    } catch (e) {
      console.error("[INVESTIGASI] GAGAL menyimpan data ke storage", e);
    }
    console.log("========================================");
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      // Pengalihan sekarang ditangani oleh _layout.tsx
    } catch (e) {
      console.error("Gagal menghapus data pengguna", e);
    }
  };

  return <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
