import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={0}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView contentContainerStyle={styles.container}>
          {/* Custom Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tambah Mahasiswa Baru</Text>
          </View>

          {/* Add Icon Button */}
          <View style={styles.addIconContainer}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={32} color="#ffffff" />
            </View>
            <Text style={styles.addText}>Tambah foto</Text>
          </View>

          {/* Form */}
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput style={styles.input} placeholder="Nama sesuai ijazah" placeholderTextColor="rgba(255,255,255,0.5)" value={name} onChangeText={setName} />

          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} placeholder="Username unik" placeholderTextColor="rgba(255,255,255,0.5)" value={username} onChangeText={setUsername} autoCapitalize="none" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="Email aktif" placeholderTextColor="rgba(255,255,255,0.5)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Nomor Induk Mahasiswa (NIM)</Text>
          <TextInput style={styles.input} placeholder="Contoh: 24/123456/SV/12345" placeholderTextColor="rgba(255,255,255,0.5)" value={registrationNumber} onChangeText={setRegistrationNumber} />

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
          <TextInput style={styles.input} placeholder="Minimal 8 karakter" placeholderTextColor="rgba(255,255,255,0.5)" value={password} onChangeText={setPassword} secureTextEntry />

          <Text style={styles.label}>Konfirmasi Password</Text>
          <TextInput style={styles.input} placeholder="Ulangi password" placeholderTextColor="rgba(255,255,255,0.5)" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#D4AF37" />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleCreateStudent}>
                <Text style={styles.buttonText}>Tambah Mahasiswa</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a5230" },
  container: { paddingBottom: 40 },

  // Style untuk header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Style untuk icon
  addIconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  addIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  addText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },

  // Style form
  label: { fontSize: 16, fontWeight: "600", color: "#ffffff", marginBottom: 8, paddingHorizontal: 20 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: "#1a5230",
    fontSize: 18,
    fontWeight: "700",
  },
});
