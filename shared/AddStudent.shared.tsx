import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/axios";

interface Program {
  id_program: number;
  name: string;
}

interface AddStudentProps {
  viewMode: "admin" | "manager";
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function CreateStudentScreen({ viewMode, onBack, onSuccess }: AddStudentProps) {
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State untuk form
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Mengambil daftar program studi dari API
  useEffect(() => {
    const fetchPrograms = async () => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await api.get("/manager/programs", {
          signal: abortControllerRef.current.signal,
        });

        if (isMounted.current && response.data?.data) {
          setPrograms(response.data.data);
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === "AbortError" || error.name === "CanceledError") {
          return;
        }

        if (isMounted.current) {
          console.error("Error fetching programs:", error);
          Alert.alert("Error", "Gagal memuat daftar program studi. Silakan coba lagi.");
        }
      } finally {
        if (isMounted.current) {
          setIsLoadingPrograms(false);
        }
      }
    };

    fetchPrograms();
  }, []);

  // Validasi email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fungsi untuk menangani pembuatan mahasiswa baru
  const handleCreateStudent = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Validasi input
    if (!name.trim() || !username.trim() || !email.trim() || !password || !passwordConfirmation || !registrationNumber.trim() || !selectedProgram) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Input Tidak Valid", "Format email tidak valid.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Input Tidak Valid", "Password minimal 8 karakter.");
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert("Input Tidak Valid", "Password dan konfirmasi password tidak cocok.");
      return;
    }

    if (!isMounted.current) return;

    setIsLoading(true);

    try {
      await api.post("/manager/students", {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        registration_number: registrationNumber.trim(),
        password: password,
        password_confirmation: passwordConfirmation,
        id_program: selectedProgram,
      });

      if (isMounted.current) {
        Alert.alert("Sukses", "Akun mahasiswa baru berhasil dibuat.", [
          {
            text: "OK",
            onPress: () => {
              if (isMounted.current) {
                onSuccess?.();
              }
            },
          },
        ]);
      }
    } catch (error) {
      if (!isMounted.current) return;

      if (axios.isAxiosError(error)) {
        console.error("Gagal menambah mahasiswa:", error.response?.data);
        const message = error.response?.data?.message || error.response?.data?.errors || "Terjadi kesalahan saat menambahkan mahasiswa.";
        Alert.alert("Gagal", typeof message === "string" ? message : JSON.stringify(message));
      } else {
        Alert.alert("Gagal", "Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Loading state untuk programs
  if (isLoadingPrograms) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Custom Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton} disabled={isLoading}>
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Tambah Mahasiswa Baru</Text>
            </View>

            {/* Form */}
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput style={styles.input} placeholder="Nama sesuai ijazah" placeholderTextColor="rgba(255,255,255,0.5)" value={name} onChangeText={setName} editable={!isLoading} maxLength={100} />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username unik"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              maxLength={50}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email aktif"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              maxLength={100}
            />

            <Text style={styles.label}>Nomor Induk Mahasiswa (NIM)</Text>
            <TextInput style={styles.input} placeholder="Contoh: 24/123456/SV/12345" placeholderTextColor="rgba(255,255,255,0.5)" value={registrationNumber} onChangeText={setRegistrationNumber} editable={!isLoading} maxLength={50} />

            <Text style={styles.label}>Program Studi</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedProgram}
                onValueChange={(itemValue) => {
                  if (itemValue !== null && itemValue !== undefined) {
                    setSelectedProgram(itemValue as number);
                  }
                }}
                enabled={!isLoading}
                style={styles.picker}
              >
                <Picker.Item label="-- Pilih Program Studi --" value={0} color="#999" />
                {programs.map((program) => (
                  <Picker.Item key={program.id_program} label={program.name} value={program.id_program} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimal 8 karakter"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              maxLength={100}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Konfirmasi Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Ulangi password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry
              editable={!isLoading}
              maxLength={100}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonContainer}>
              {isLoading ? (
                <View style={styles.loadingButton}>
                  <ActivityIndicator size="small" color="#1a5230" />
                  <Text style={styles.loadingButtonText}>Memproses...</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleCreateStudent} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Tambah Mahasiswa</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a5230" },
  container: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ffffff",
  },

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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
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
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#ffffff",
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
  loadingButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    opacity: 0.7,
  },
  loadingButtonText: {
    color: "#1a5230",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
});
