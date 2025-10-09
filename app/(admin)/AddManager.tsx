import axios from "axios";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext"; // Asumsi path context Anda

// Definisikan IP dan URL API di sini
const IP_ADDRESS = "192.168.0.159";
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api/admin/add-managers`;

export default function AddManager() {
  const { token } = useAuth(); // Ambil token dari context untuk otentikasi

  // State untuk setiap input form
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi yang dipanggil saat tombol "Tambah Manajer" ditekan
  const handleAddManager = async () => {
    // Validasi sederhana di sisi client
    if (!name || !username || !email || !password) {
      Alert.alert("Error", "Semua field wajib diisi.");
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert("Error", "Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      // Panggil endpoint API untuk membuat manajer
      const response = await axios.post(
        API_BASE_URL, // URL endpoint
        {
          // Body data yang dikirim
          name: name,
          username: username,
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
        },
        {
          // Headers untuk otentikasi
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      // Jika berhasil
      Alert.alert("Sukses", `Manajer "${response.data.data.name}" berhasil ditambahkan.`);

      // Kosongkan form setelah berhasil
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      console.error("Gagal menambah manajer:", error);

      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 422) {
          // Error validasi
          // Ambil pesan error validasi pertama
          const errors = error.response.data.errors;
          //   errorMessage = Object.values(errors)[0][0];
        } else if (error.response.status === 403) {
          // Error hak akses
          errorMessage = "Anda tidak memiliki hak akses untuk melakukan aksi ini.";
        }
      }
      Alert.alert("Gagal", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Konfigurasi Header Halaman */}
      <Stack.Screen options={{ title: "Tambah Manajer Baru", headerTitleAlign: "center" }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Form Penambahan Manajer</Text>
        <Text style={styles.subtitle}>Isi detail di bawah untuk membuat akun manajer baru.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput style={styles.input} placeholder="Contoh: Budi Santoso" value={name} onChangeText={setName} />

          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} placeholder="Contoh: budimanager" value={username} onChangeText={setUsername} autoCapitalize="none" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="contoh@mail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Minimal 8 karakter" value={password} onChangeText={setPassword} secureTextEntry />

          <Text style={styles.label}>Konfirmasi Password</Text>
          <TextInput style={styles.input} placeholder="Ulangi password" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={handleAddManager} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Tambah Manajer</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f4f7",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#ffffff",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#015023",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
