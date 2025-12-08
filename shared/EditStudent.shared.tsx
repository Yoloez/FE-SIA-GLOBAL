import api from "@/api/axios";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EditStudentProps {
  viewMode: "admin" | "manager";
  studentId: string;
  initialData: {
    full_name: string;
    nim: string;
    email: string;
    program: string;
    image?: string | null;
  };
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function EditStudent({ viewMode, studentId, initialData, onBack, onSuccess }: EditStudentProps) {
  const [formData, setFormData] = useState({
    name: initialData.full_name || "",
    nim: initialData.nim || "",
    email: initialData.email || "",
    program: initialData.program || "",
    password: "",
    image: initialData.image || null,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- IMAGE PICKER FUNCTIONS ---
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Izinkan akses ke galeri untuk memilih foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Izinkan akses ke kamera untuk mengambil foto.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const showImageOptions = () => {
    Alert.alert("Pilih Foto", "Pilih sumber foto profil", [
      { text: "Galeri", onPress: pickImage },
      { text: "Kamera", onPress: takePhoto },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    try {
      const updateData: any = {
        full_name: formData.name,
        registration_number: formData.nim,
        email: formData.email,
      };

      if (formData.image && !formData.image.startsWith("http")) {
        updateData.image = formData.image;
      }

      await api.put(`/manager/students/${studentId}`, updateData);

      Alert.alert("Sukses", "Data mahasiswa berhasil diperbarui!");
      onSuccess?.();
    } catch (error: any) {
      console.log("ERROR SAVE:", error.response?.data || error);
      Alert.alert("Error", "Gagal menyimpan perubahan");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* FORM */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name:</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(value) => handleChange("name", value)} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIM:</Text>
              <TextInput style={styles.input} value={formData.nim} onChangeText={(value) => handleChange("nim", value)} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email:</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={(value) => handleChange("email", value)} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Program:</Text>
              <TextInput style={[styles.input, { opacity: 0.6 }]} value={formData.program} editable={false} />
            </View>
          </View>

          {/* BUTTON SAVE */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { flex: 1, backgroundColor: "#015023" },
  content: { padding: 20 },
  profileSection: { alignItems: "center", marginBottom: 30 },
  profileImageContainer: { position: "relative" },
  profileImage: { width: 96, height: 96, borderRadius: 48 },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: "#FFD43B",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  editText: { color: "#fff", fontSize: 14, marginTop: 10 },
  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: "#fff", fontSize: 14, marginBottom: 6 },
  input: { backgroundColor: "#024830", borderColor: "#036640", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: "#fff", fontSize: 16 },
  saveButton: { backgroundColor: "#FFD43B", paddingVertical: 16, borderRadius: 25, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "#015023", fontSize: 16, fontWeight: "600" },
});
