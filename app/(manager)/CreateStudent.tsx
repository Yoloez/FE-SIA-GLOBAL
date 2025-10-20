import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

interface Program {
  id: number;
  name: string;
}

export default function CreateStudentScreen() {
  const router = useRouter();

  // State untuk form
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mengambil daftar program studi dari API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get("/manager/programs");
        setPrograms(response.data.data);
      } catch (error) {
        Alert.alert("Error", "Gagal memuat daftar program studi.");
      }
    };
    fetchPrograms();
  }, []);

  // Fungsi untuk menangani pembuatan mahasiswa baru
  const handleCreateStudent = async () => {
    if (!name || !username || !email || !password || !registrationNumber || !selectedProgram) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert("Input Tidak Valid", "Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/manager/students", {
        name: name,
        username: username,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation,
        program_id: selectedProgram,
        registration_number: registrationNumber,
      });
      Alert.alert("Sukses", "Akun mahasiswa baru berhasil dibuat.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Gagal menambah mahasiswa:", error.response?.data);
        const message = error.response?.data?.message || "Terjadi kesalahan.";
        Alert.alert("Gagal", message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Tambah Mahasiswa Baru", presentation: "modal", headerTitleAlign: "center" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nama Lengkap</Text>
        <TextInput style={styles.input} placeholder="Nama sesuai ijazah" value={name} onChangeText={setName} />

        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} placeholder="Username unik" value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="Email aktif" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Nomor Induk Mahasiswa (NIM)</Text>
        <TextInput style={styles.input} placeholder="Contoh: 24/123456/SV/12345" value={registrationNumber} onChangeText={setRegistrationNumber} />

        <Text style={styles.label}>Program Studi</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedProgram} onValueChange={(itemValue) => setSelectedProgram(itemValue)}>
            <Picker.Item label="-- Pilih Program Studi --" value={null} />
            {programs.map((program) => (
              <Picker.Item key={program.id} label={program.name} value={program.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Minimal 8 karakter" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Konfirmasi Password</Text>
        <TextInput style={styles.input} placeholder="Ulangi password" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />

        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#015023" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleCreateStudent}>
              <Text style={styles.buttonText}>Tambah Mahasiswa</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#015023",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
