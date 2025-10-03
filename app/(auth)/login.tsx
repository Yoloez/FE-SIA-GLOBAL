import { Urbanist_400Regular, Urbanist_600SemiBold, useFonts } from "@expo-google-fonts/urbanist";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
// <-- 1. Impor ActivityIndicator untuk loading & axios untuk API call
import axios from "axios";
import { ActivityIndicator, Alert, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// <-- 2. Definisikan IP dan URL API di sini agar mudah diubah
const IP_ADDRESS = "10.33.207.36"; // Ganti dengan IP Address laptop Anda
const API_URL = `http://${IP_ADDRESS}:8000/api/auth/login`;

export default function LoginScreen() {
  let [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <-- 3. State untuk loading
  const { login } = useAuth();
  const router = useRouter();

  // <-- 4. Logika handleLogin diubah total untuk memanggil API
  const handleLogin = async () => {
    // Validasi input di sisi client
    if (!email || !password) {
      Alert.alert("Login Gagal", "Email dan password tidak boleh kosong.");
      return;
    }

    setIsLoading(true); // Mulai loading

    try {
      // Kirim data ke server Laravel
      const response = await axios.post(API_URL, {
        email: email,
        password: password,
      });

      // Jika berhasil, ambil data user dan token dari respons
      const { user, access_token } = response.data.data;

      // Panggil fungsi login dari AuthContext untuk menyimpan data & token
      // AuthContext akan menangani navigasi secara otomatis
      login(user, access_token);
    } catch (error) {
      console.error("Login Error:", error.response ? error.response.data : error.message);

      // Tampilkan pesan error yang lebih spesifik
      if (axios.isAxiosError(error) && error.response) {
        // Error dari server (misal: 401 Unauthorized, 422 Validation Error)
        Alert.alert("Login Gagal", error.response.data.message || "Email atau password yang Anda berikan salah.");
      } else {
        // Error jaringan atau lainnya
        Alert.alert("Koneksi Gagal", "Tidak dapat terhubung ke server. Pastikan server berjalan dan Anda berada di jaringan yang sama.");
      }
    } finally {
      setIsLoading(false); // Hentikan loading, baik berhasil maupun gagal
    }
  };

  // Mencegah rendering jika font belum siap
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>
          <Image source={require("../../assets/images/logo-ugn.png")} style={styles.title}></Image>

          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="user@mail.com" value={email} onChangeText={setEmail} placeholderTextColor="grey" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="grey" />
          </View>

          <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
            <Text style={{ fontSize: 16, color: "white", marginTop: -7, marginBottom: 15, alignSelf: "flex-end", fontFamily: "Urbanist_400Regular" }}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Tombol Login */}
          {/* <-- 5. Tombol dinonaktifkan saat loading */}
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              // Tampilkan indikator loading jika sedang proses
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              // Tampilkan teks jika tidak loading
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// STYLESHEET TIDAK DIUBAH SAMA SEKALI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  title: {
    justifyContent: "center",
    width: 150,
    height: 170,
    fontFamily: "Urbanist_400Regular",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 45,
    color: "white",
    alignSelf: "center",
  },
  label: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "Urbanist_400Regular",
  },
  input: {
    height: 55,
    backgroundColor: "white",
    borderColor: "black",
    borderWidth: 2,
    color: "black",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: "Urbanist_400Regular",
  },
  button: {
    backgroundColor: "#DABC4E",
    paddingVertical: 18,
    borderRadius: 30,
    width: "100%",
    marginTop: 20,
  },
  buttonText: {
    fontFamily: "Urbanist_400Regular",
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
