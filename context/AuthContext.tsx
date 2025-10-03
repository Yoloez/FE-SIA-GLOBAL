import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// Definisikan tipe data untuk objek pengguna agar konsisten
interface User {
  id: number;
  name: string;
  email: string;
  role: "mahasiswa" | "dosen" | "admin" | "manager" | null; // Tipe peran
  // Anda bisa menambahkan 'permissions' di sini jika perlu
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Fungsi untuk memuat data dari storage saat aplikasi pertama kali dibuka
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (storedToken && storedUserData) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserData));
        }
      } catch (e) {
        console.error("Failed to load auth data from storage", e);
      }
    };
    loadAuthData();
  }, []);

  const login = async (userData: User, token: string) => {
    try {
      setUser(userData);
      setToken(token);
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to save auth data to storage", e);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
    } catch (e) {
      console.error("Failed to remove auth data from storage", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
