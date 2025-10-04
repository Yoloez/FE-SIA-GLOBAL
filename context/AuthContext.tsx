import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
// 1. Hapus impor 'router' dari sini untuk memutus lingkaran dependensi
// import { router } from 'expo-router';

interface User {
  id: number;
  name: string;
  email: string;
  role: "mahasiswa" | "dosen" | "admin" | "manager" | "applicant" | null;
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
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (storedToken && storedUserData) {
          setUser(JSON.parse(storedUserData));
          setToken(storedToken);
        }
      } catch (e) {
        console.error("Gagal memuat data pengguna dari storage", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (userData: User, authToken: string) => {
    try {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem("userToken", authToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (e) {
      console.error("Gagal menyimpan data pengguna", e);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");

      // 2. Hapus `router.replace()` dari sini.
      // Pengalihan akan ditangani secara otomatis oleh app/_layout.tsx
      // saat ia melihat `isLoggedIn` berubah menjadi false.
    } catch (e) {
      console.error("Gagal menghapus data pengguna", e);
    }
  };

  return <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
