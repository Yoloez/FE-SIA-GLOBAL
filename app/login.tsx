// app/(auth)/login.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 1. Impor useRouter
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";

// Path ini disesuaikan lagi jika perlu

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter(); // 2. Panggil useRouter di sini

  const handleLogin = () => {
    // Simulasi validasi
    if (email === "user@mail.com" && password === "123456") {
      // Panggil fungsi login dari context
      login();

      // 3. TAMBAHKAN PERINTAH PINDAH HALAMAN DI SINI
      router.replace("/");
    } else {
      Alert.alert("Login Gagal", "Email atau password salah!");
    }
  };

  return (
    <LinearGradient
      colors={["#1C352D", "#0D1B1E"]} // warna grada  i
      start={{ x: 10, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Image source={require("../assets/images/logo-ugn.png")} style={styles.logo} />
      <Text style={styles.ugnTitle}>Universitas Global Nusantara</Text>
      <Text style={styles.title}>Login</Text>
      <TextInput style={styles.input} placeholder="Email (user@mail.com)" value={email} onChangeText={setEmail} placeholderTextColor="grey" />
      <TextInput style={styles.input} placeholder="Password (123456)" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="grey" />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 25, backgroundColor: "#1C352D" },
  logo: {
    position: "absolute",
    top: 0,
    right: 20,
    width: 75,
    height: 100,
  },
  title: { fontSize: 38, fontWeight: "bold", textAlign: "center", marginBottom: 34, color: "white" },
  ugnTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    position: "absolute",
    top: 20,
    marginLeft: 0,
    left: 0,
    width: "60%",
  },
  input: {
    height: 50,
    borderColor: "white",
    borderWidth: 1,
    color: "white",
    borderRadius: 8,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 15,
    borderRadius: 30,
    position: "absolute",
    bottom: 20,
    width: "90%",
    left: 0,
    right: 0,
    marginHorizontal: "auto", // auto center horizontal
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold", textAlign: "center" },
});
