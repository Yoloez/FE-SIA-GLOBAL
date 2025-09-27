// app/(auth)/login.tsx

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    if (email === "" && password === "") {
      login();
      router.replace("/");
    } else {
      Alert.alert("Login Gagal", "Email atau password salah!");
    }
  };

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>
          <Image source={require("../assets/images/logo-ugn.png")} style={styles.title}></Image>

          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="user@mail.com" value={email} onChangeText={setEmail} placeholderTextColor="grey" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="grey" />
          </View>

          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Text style={{ fontSize: 16, color: "white", marginTop: -7, marginBottom: 15, alignSelf: "flex-end" }}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Tombol Login */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// 3. STYLESHEET YANG SUDAH DIPERBAIKI TOTAL
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    // alignItems: "center",
    justifyContent: "center",
    // Mendorong semua konten ke tengah layar
    paddingHorizontal: 25, // Memberi jarak kiri dan kanan
  },
  title: {
    justifyContent: "center",
    // width: "100%",
    width: 150,
    height: 170,
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
    marginBottom: 20, // Jarak antar input
  },
  button: {
    backgroundColor: "#DABC4E",
    paddingVertical: 18,
    borderRadius: 30,
    width: "100%",
    marginTop: 20, // Jarak dari input password ke tombol
  },
  buttonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
