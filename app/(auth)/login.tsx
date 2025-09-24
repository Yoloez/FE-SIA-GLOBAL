// app/(auth)/login.tsx

import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
// import { useAuth } from "../../hooks/useAuth";
import { useAuth } from "../../context/AuthContext"; // Ambil dari wadah

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
      <Text style={styles.title}>Login</Text>
      <TextInput style={styles.input} placeholder="Email (user@mail.com)" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password (123456)" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 24 },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
});
