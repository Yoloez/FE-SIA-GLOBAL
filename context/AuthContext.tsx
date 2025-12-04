import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// Tipe data untuk User, pastikan sesuai
interface User {
  id_user_si: number;
  name: string;
  email: string;
  role: "mahasiswa" | "dosen" | "admin" | "manager" | "student" | null;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
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
    console.log("[INVESTIGASI] User Data yang akan disimpan:", userData);
    console.log("[INVESTIGASI] User ID:", userData.id_user_si);
    console.log("[INVESTIGASI] User Name:", userData.name);
    console.log("[INVESTIGASI] User Role:", userData.role);
    console.log("[INVESTIGASI] Token:", authToken ? "Ada" : "Tidak ada");
    try {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem("userToken", authToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      console.log("[INVESTIGASI] Data sesi untuk", userData.name, "berhasil disimpan.");

      // Verifikasi data tersimpan
      const savedData = await AsyncStorage.getItem("userData");
      console.log("[INVESTIGASI] Verifikasi data tersimpan:", savedData);
    } catch (e) {
      console.error("[INVESTIGASI] GAGAL menyimpan data ke storage", e);
    }
    console.log("========================================");
  };

  const logout = async () => {
    console.log("========================================");
    console.log("[LOGOUT] Memulai proses logout...");
    try {
      console.log("[LOGOUT] Menghapus state user dan token...");
      setUser(null);
      setToken(null);

      console.log("[LOGOUT] Menghapus data dari AsyncStorage...");
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");

      console.log("[LOGOUT] Logout berhasil! Pengalihan akan ditangani oleh _layout.tsx");
    } catch (e) {
      console.error("[LOGOUT] GAGAL menghapus data pengguna:", e);
    }
    console.log("========================================");
  };

  const forceLogout = async () => {
    console.log("========================================");
    console.log("[FORCE LOGOUT] Memulai FORCE LOGOUT...");
    try {
      // Clear state immediately
      setUser(null);
      setToken(null);

      // Clear ALL AsyncStorage
      console.log("[FORCE LOGOUT] Menghapus SEMUA data dari AsyncStorage...");
      const keys = await AsyncStorage.getAllKeys();
      console.log("[FORCE LOGOUT] Keys ditemukan:", keys);
      await AsyncStorage.multiRemove(keys);

      console.log("[FORCE LOGOUT] FORCE LOGOUT berhasil! App akan redirect ke login...");
    } catch (e) {
      console.error("[FORCE LOGOUT] Error:", e);
    }
    console.log("========================================");
  };

  return <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, isLoading, login, logout, forceLogout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
