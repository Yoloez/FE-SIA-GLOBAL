import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

// --- KONFIGURASI API ---
const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Address laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

export default function CreateLecturerScreen() {
  const { token } = useAuth();
  const router = useRouter();

  // State untuk setiap input form
  const [name, setName] = useState(""); 
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi yang dipanggil saat tombol "Tambah Dosen" ditekan
  const handleCreateLecturer = async () => {
    if (!name || !username || !email || !password || !passwordConfirmation) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert("Input Tidak Valid", "Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/manager/lecturers`, // URL endpoint baru
        {
          name: name,
          username: username,
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      Alert.alert("Sukses", `Dosen "${response.data.data.name}" berhasil ditambahkan.`);
      router.back();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Gagal menambah dosen:", error.response?.data);
        const message = error.response?.data?.message || "Terjadi kesalahan saat menghubungi server.";
        Alert.alert("Gagal", message);
      }
    } finally {
      setIsLoading(false);
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Tambah Dosen Baru", presentation: "modal", headerTitleAlign: "center" }} />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Form Dosen Baru</Text>
          <Text style={styles.subtitle}>Isi detail di bawah untuk membuat akun dosen baru.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput style={styles.input} placeholder="Contoh: Dr. Budi Hartono" value={name} onChangeText={setName} />

            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} placeholder="Contoh: budihartono" value={username} onChangeText={setUsername} autoCapitalize="none" />

            <Text style={styles.label}>Email Institusi</Text>
            <TextInput style={styles.input} placeholder="contoh@kampus.ac.id" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Minimal 8 karakter" value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Konfirmasi Password</Text>
            <TextInput style={styles.input} placeholder="Ulangi password" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />

            <TouchableOpacity style={styles.button} onPress={handleCreateLecturer} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Tambah Dosen</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f0f4f7" },
    container: { padding: 20 },
    title: { fontSize: 24, fontWeight: "bold", color: "#333", textAlign: "center" },
    subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 30 },
    form: { width: "100%" },
    label: { fontSize: 16, color: "#555", marginBottom: 8, fontWeight: "600" },
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
}
