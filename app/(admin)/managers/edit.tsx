import api from "@/api/axios";
import { handleApiError } from "@/utils/errorHandler";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditManagerScreen() {
  // Ambil data dari params
  const params = useLocalSearchParams();
  const managerId = params.id_user_si as string;

  // State untuk form
  const [name, setName] = useState((params.name as string) || "");
  const [email, setEmail] = useState((params.email as string) || "");
  const [employeeIdNumber, setEmployeeIdNumber] = useState((params.employee_id_number as string) || "");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validasi form
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama tidak boleh kosong");
      return false;
    }
    if (name.trim().length < 4) {
      Alert.alert("Validasi", "Nama minimal 4 karakter");
      return false;
    }
    if (!employeeIdNumber.trim()) {
      Alert.alert("Validasi", "Username (NIP) tidak boleh kosong");
      return false;
    }
    if (employeeIdNumber.trim().length < 3) {
      Alert.alert("Validasi", "Username minimal 3 karakter");
      return false;
    }
    // Validasi alpha_dash (huruf, angka, dash, underscore)
    const usernamRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernamRegex.test(employeeIdNumber.trim())) {
      Alert.alert("Validasi", "Username hanya boleh huruf, angka, dash, dan underscore");
      return false;
    }

    return true;
  };

  // Handle submit update
  const handleUpdate = async () => {
    if (!validateForm()) return;

    Alert.alert("Konfirmasi Update", "Apakah Anda yakin ingin mengupdate data manajer ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          setIsLoading(true);
          try {
            // Siapkan data yang akan dikirim
            const updateData = {
              name: name.trim(),
              username: employeeIdNumber.trim(), // NIP sebagai username
            };

            // Kirim request update ke API menggunakan POST
            await api.post(`/profile/staff`, updateData);

            Alert.alert("Sukses", "Data manajer berhasil diupdate", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          } catch (error) {
            const apiError = handleApiError(error);
            Alert.alert("Gagal", apiError.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Edit Manajer",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Nama */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <Text style={styles.helperText}>Minimal 4 karakter</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Masukkan nama lengkap" placeholderTextColor="#999" editable={!isLoading} />
            </View>

            {/* Email - Read Only */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.helperText}>Email tidak dapat diubah</Text>
              <TextInput style={[styles.input, styles.inputDisabled]} value={email} placeholder="Email" placeholderTextColor="#999" editable={false} />
            </View>

            {/* Username/NIP */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput style={styles.input} value={employeeIdNumber} onChangeText={setEmployeeIdNumber} placeholder="Masukkan username/NIP" placeholderTextColor="#999" autoCapitalize="none" editable={!isLoading} />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity style={[styles.updateButton, isLoading && styles.updateButtonDisabled]} onPress={handleUpdate} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#015023" /> : <Text style={styles.updateButtonText}>Update Data</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    flex: 1,
    backgroundColor: "#015023",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 0,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#CCCCCC",
    marginBottom: 10,
  },
  editImageText: {
    color: "#FFD43B",
    fontSize: 14,
    fontWeight: "500",
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  helperText: {
    color: "#FFD43B",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: "#333",
    fontSize: 15,
    borderWidth: 2,
    borderColor: "#333",
  },
  inputDisabled: {
    backgroundColor: "#E5E5E5",
    opacity: 0.6,
  },
  updateButton: {
    backgroundColor: "#FFD43B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#333",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#015023",
    fontSize: 16,
    fontWeight: "700",
  },
});
