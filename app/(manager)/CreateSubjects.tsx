import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext"; // Sesuaikan path jika perlu

// Definisikan IP dan URL API Anda
const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Address laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

export default function CreateSubjectScreen() {
  const { token } = useAuth(); // Ambil token untuk otentikasi
  const router = useRouter();

  // State untuk setiap input form
  const [nameSubject, setNameSubject] = useState("");
  const [codeSubject, setCodeSubject] = useState("");
  const [sks, setSks] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi yang dipanggil saat tombol "Buat Mata Kuliah" ditekan
  const handleCreateSubject = async () => {
    // Validasi sederhana di sisi client
    if (!nameSubject || !codeSubject || !sks) {
      Alert.alert("Error", "Semua kolom wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      // Panggil endpoint API untuk membuat mata kuliah baru
      const response = await axios.post(
        `${API_BASE_URL}/manager/subjects`, // URL endpoint
        {
          // Body data yang dikirim
          name_subject: nameSubject,
          code_subject: codeSubject,
          sks: parseInt(sks, 10), // Pastikan SKS dikirim sebagai angka
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
      Alert.alert("Sukses", `Mata kuliah "${response.data.data.name_subject}" berhasil ditambahkan.`);

      // Kembali ke halaman sebelumnya setelah berhasil
      router.back();
    } catch (error) {
      console.error("Gagal menambah mata kuliah:", error);

      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (axios.isAxiosError(error) && error.response) {
        // Tampilkan error validasi dari Laravel jika ada
        if (error.response.status === 422) {
          const errors = error.response.data.errors;
          // errorMessage = Object.values(errors)[0][0]; // Ambil pesan error pertama
        } else if (error.response.status === 403) {
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
      <Stack.Screen options={{ title: "Tambah Mata Kuliah", headerTitleAlign: "center", presentation: "modal" }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Form Mata Kuliah Baru</Text>
        <Text style={styles.subtitle}>Isi detail di bawah untuk membuat mata kuliah baru.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nama Mata Kuliah</Text>
          <TextInput style={styles.input} placeholder="Contoh: Pemrograman Web Lanjut" value={nameSubject} onChangeText={setNameSubject} />

          <Text style={styles.label}>Kode Mata Kuliah</Text>
          <TextInput style={styles.input} placeholder="Contoh: IF-212" value={codeSubject} onChangeText={setCodeSubject} autoCapitalize="characters" />

          <Text style={styles.label}>Jumlah SKS</Text>
          <TextInput style={styles.input} placeholder="Contoh: 3" value={sks} onChangeText={setSks} keyboardType="numeric" />

          <TouchableOpacity style={styles.button} onPress={handleCreateSubject} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Tambah Mata Kuliah</Text>}
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

<Stack>
  {/* ... layar lain ... */}
  <Stack.Screen name="CreateSubjects" options={{ title: "Tambah Mata Kuliah" }} />
</Stack>;
