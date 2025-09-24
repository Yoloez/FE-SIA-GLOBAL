// app/(auth)/login.tsx

import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
// import { useAuth } from "../../hooks/useAuth";
import { TouchableOpacity } from "react-native"; // Ambil dari wadah
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // Ambil fungsi login dari context

  const handleLogin = () => {
    // Simulasi validasi
    if (email === "user@mail.com" && password === "123456") {
      // Panggil fungsi login dari context
      // Data ini bisa berasal dari response API
      login();
    } else {
      Alert.alert("Login Gagal", "Email atau password salah!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} className="text-white text-center text-2xl font-bold">
        Login
      </Text>
      <TextInput style={styles.input} placeholder="Email (user@mail.com)" value={email} onChangeText={setEmail} placeholderTextColor="white" />
      <TextInput style={styles.input} placeholder="Password (123456)" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="white" />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 25, backgroundColor: "#1e293b" },
  title: { fontSize: 38, fontWeight: "bold", textAlign: "center", marginBottom: 24, color: "white" },
  input: {
    height: 50,
    borderColor: "white",
    borderWidth: 1,
    color: "white",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  button: { backgroundColor: "#3b82f6", paddingVertical: 15, borderRadius: 8 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold", textAlign: "center" },
});
