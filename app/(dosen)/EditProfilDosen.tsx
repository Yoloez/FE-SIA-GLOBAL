import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function EditProfilScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  // State untuk form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [employeeIdNumber, setEmployeeIdNumber] = useState("");
  const [position, setPosition] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fungsi untuk mengambil data profil saat ini
  const fetchProfile = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/lecturer/profile");
      const data = response.data.data;

      console.log("Profile data:", data);

      setFullName(data.full_name || "");
      setEmail(data.email || "");
      setProfileImage(data.profile_image || null);
      setEmployeeIdNumber(data.employee_id_number || "");
      setPosition(data.position || "");
    } catch (error) {
      console.error("Fetch profile error:", error);
      Alert.alert("Error", "Gagal memuat data profil.");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // Fungsi untuk memilih gambar
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Izinkan akses ke galeri untuk mengganti foto profil.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Get file extension
        const uriParts = asset.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        setProfileImage(asset.uri);
        setImageFile({
          uri: Platform.OS === "android" ? asset.uri : asset.uri.replace("file://", ""),
          type: `image/${fileType}`,
          name: `profile_${Date.now()}.${fileType}`,
        });

        console.log("Image selected:", {
          uri: asset.uri,
          type: `image/${fileType}`,
          name: `profile_${Date.now()}.${fileType}`,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar.");
    }
  };

  // Fungsi untuk menyimpan perubahan
  const handleSave = async () => {
    // Validasi input
    if (!fullName.trim()) {
      Alert.alert("Validasi", "Nama lengkap tidak boleh kosong.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Validasi", "Email tidak boleh kosong.");
      return;
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Validasi", "Format email tidak valid.");
      return;
    }

    // Validasi password jika diisi
    if (newPassword && !currentPassword) {
      Alert.alert("Validasi", "Masukkan password saat ini untuk mengubah password.");
      return;
    }

    if (newPassword && newPassword !== newPasswordConfirmation) {
      Alert.alert("Validasi", "Konfirmasi password baru tidak cocok.");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      Alert.alert("Validasi", "Password baru minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      // Data wajib - selalu kirim
      formData.append("full_name", fullName.trim());
      formData.append("email", email.trim());

      // Data opsional untuk staff profile
      if (employeeIdNumber.trim()) {
        formData.append("employee_id_number", employeeIdNumber.trim());
      }
      if (position.trim()) {
        formData.append("position", position.trim());
      }

      // Password (opsional)
      if (currentPassword && newPassword) {
        formData.append("current_password", currentPassword);
        formData.append("new_password", newPassword);
        formData.append("new_password_confirmation", newPasswordConfirmation);
      }

      // Image (opsional)
      if (imageFile) {
        formData.append("profile_image", {
          uri: imageFile.uri,
          type: imageFile.type,
          name: imageFile.name,
        } as any);
      }

      console.log("Sending update request...");

      // Kirim request
      const response = await api.post("/lecturer/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        transformRequest: (data, headers) => {
          return data;
        },
      });

      console.log("Update response:", response.data);

      // Update profile image jika ada URL baru dari response
      if (response.data.data?.profile_image_url) {
        setProfileImage(response.data.data.profile_image_url);
      }

      // Refresh user context jika ada
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (refreshError) {
          console.log("Refresh user error:", refreshError);
        }
      }

      Alert.alert("Sukses", "Profil berhasil diperbarui.", [
        {
          text: "OK",
          onPress: () => {
            // Clear password fields
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordConfirmation("");
            setImageFile(null);

            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Update profile error:", error);

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Terjadi kesalahan saat memperbarui profil.";
        const errors = error.response?.data?.errors;
        const status = error.response?.status;

        console.error("Error response:", {
          status,
          message,
          errors,
          data: error.response?.data,
        });

        if (status === 422) {
          // Validation error
          if (errors) {
            const errorMessages = Object.values(errors).flat().join("\n");
            Alert.alert("Validasi Gagal", errorMessages);
          } else {
            Alert.alert("Gagal", message);
          }
        } else if (status === 403) {
          Alert.alert("Akses Ditolak", message);
        } else if (status === 500) {
          Alert.alert("Error Server", "Terjadi kesalahan di server. Silakan coba lagi atau hubungi administrator.");
        } else {
          Alert.alert("Error", message);
        }
      } else {
        Alert.alert("Error", "Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.containerLoading]}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Edit Profil" }} />
        <StatusBar barStyle="light-content" backgroundColor="#1a5f3f" />
        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Edit Profile</Text>

            <View style={styles.avatarContainer}>
              <Image source={profileImage ? { uri: profileImage } : require("../../assets/images/kairi.png")} style={styles.avatar} />
              <TouchableOpacity style={styles.editImageButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={0}>
              <ScrollView style={{ flex: 1, width: "100%" }} showsVerticalScrollIndicator={false}>
                {/* Nama Lengkap */}
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Nama Lengkap: *</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={fullName} onChangeText={setFullName} placeholder="Masukkan nama lengkap" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Email: *</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Masukkan email" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* NIP/Employee ID */}
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>NIP/ID Pegawai:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={employeeIdNumber} onChangeText={setEmployeeIdNumber} placeholder="Masukkan NIP" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* Posisi/Jabatan */}
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Posisi/Jabatan:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={position} onChangeText={setPosition} placeholder="Masukkan posisi" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* Section Ubah Password */}
                <Text style={styles.passwordSectionTitle}>Ubah Password (Opsional)</Text>

                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Password Saat Ini:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Masukkan password saat ini" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Password Baru:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Minimal 8 karakter" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Konfirmasi Password Baru:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={newPasswordConfirmation} onChangeText={setNewPasswordConfirmation} secureTextEntry placeholder="Konfirmasi password baru" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={[styles.settingButton, isLoading && styles.disabledButton]} onPress={handleSave} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#1a1a1a" /> : <Text style={styles.settingButtonText}>Simpan Perubahan</Text>}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 80,
    backgroundColor: "transparent",
  },
  containerLoading: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileCard: {
    borderRadius: 0,
    padding: 30,
    paddingTop: 35,
    paddingBottom: 40,
    flex: 1,
  },
  profileTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 25,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: "40%",
    backgroundColor: "#DABC4E",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#015023",
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
  },
  infoBox: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    paddingLeft: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoText: {
    color: "#ffffff",
    fontSize: 14,
    paddingVertical: 10,
  },
  settingButton: {
    backgroundColor: "#DABC4E",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  passwordSectionTitle: {
    color: "#DABC4E",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 15,
  },
  keyboardView: {
    flex: 1,
  },
});
