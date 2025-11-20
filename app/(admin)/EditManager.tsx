import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { handleApiError } from "../../utils/errorHandler";

export default function EditManagerScreen() {
  // Ambil data dari params
  const params = useLocalSearchParams();
  const managerId = params.id_user_si as string;

  // State untuk form
  const [name, setName] = useState(params.name as string || "");
  const [email, setEmail] = useState(params.email as string || "");
  const [employeeIdNumber, setEmployeeIdNumber] = useState(
    params.employee_id_number as string || ""
  );
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validasi form
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama tidak boleh kosong");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Validasi", "Email tidak boleh kosong");
      return false;
    }
    if (!employeeIdNumber.trim()) {
      Alert.alert("Validasi", "NIP tidak boleh kosong");
      return false;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Validasi", "Format email tidak valid");
      return false;
    }

    return true;
  };

  // Handle submit update
  const handleUpdate = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Konfirmasi Update",
      "Apakah Anda yakin ingin mengupdate data manajer ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Siapkan data yang akan dikirim
              const updateData: any = {
                name: name.trim(),
                email: email.trim(),
                employee_id_number: employeeIdNumber.trim(),
              };

              // Tambahkan password jika diisi
              if (password.trim()) {
                updateData.password = password.trim();
              }

              // Kirim request update ke API
              await api.put(`/admin/managers/${managerId}`, updateData);

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
      ]
    );
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../../assets/images/kairi.png")}
              style={styles.profileImage}
            />
            <Text style={styles.editImageText}>Edit Foto</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Nama */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* NIP */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIP (Nomor Induk Pegawai)</Text>
              <TextInput
                style={styles.input}
                value={employeeIdNumber}
                onChangeText={setEmployeeIdNumber}
                placeholder="Masukkan NIP"
                placeholderTextColor="#999"
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            {/* Password (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password Baru (Opsional)</Text>
              <Text style={styles.helperText}>
                Kosongkan jika tidak ingin mengubah password
              </Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password baru"
                placeholderTextColor="#999"
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#015023" />
            ) : (
              <Text style={styles.updateButtonText}>Update Data</Text>
            )}
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
    paddingTop:0,
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