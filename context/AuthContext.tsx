import React, { createContext, useContext, useState } from "react";

// 1. Definisikan "bentuk" atau tipe dari data yang ada di dalam context
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

// 2. Beri tahu tipe saat membuat context. Nilainya bisa AuthContextType atau null.
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Definisikan tipe untuk props dari AuthProvider, khususnya untuk 'children'
interface AuthProviderProps {
  children: React.ReactNode;
}

// Komponen "Penyedia Wadah"
export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  // Objek value sekarang cocok dengan tipe AuthContextType
  const value = { isLoggedIn, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook untuk mempermudah mengambil isi "wadah"
export function useAuth() {
  const context = useContext(AuthContext);

  // 4. Tambahkan pengecekan agar TypeScript yakin context tidak akan pernah null saat digunakan
  if (context === null) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }

  return context;
}
