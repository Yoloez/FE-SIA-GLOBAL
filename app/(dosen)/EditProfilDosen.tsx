import api from "@/api/axios";
import CustomAlert from "@/components/CustomAlert";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useLecturerData } from "../../context/LecturerDataContext";

export default function EditProfilScreen() {
  const { user } = useAuth();
  const { refreshProfile } = useLecturerData();
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

  // State untuk show/hide password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirmation, setShowNewPasswordConfirmation] = useState(false);

  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

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
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Gagal memuat data profil.",
        type: "error",
      });
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
        setAlertConfig({
          visible: true,
          title: "Izin Ditolak",
          message: "Izinkan akses ke galeri untuk mengganti foto profil.",
          type: "error",
        });
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
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Gagal memilih gambar.",
        type: "error",
      });
    }
  };

  // Fungsi untuk menyimpan perubahan
  const handleSave = async () => {
    // Validasi input
    if (!fullName.trim()) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Nama lengkap tidak boleh kosong.",
        type: "error",
      });
      return;
    }

    if (!email.trim()) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Email tidak boleh kosong.",
        type: "error",
      });
      return;
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Format email tidak valid.",
        type: "error",
      });
      return;
    }

    // Validasi password jika diisi
    if (newPassword && !currentPassword) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Masukkan password saat ini untuk mengubah password.",
        type: "error",
      });
      return;
    }

    if (newPassword && newPassword !== newPasswordConfirmation) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Konfirmasi password baru tidak cocok.",
        type: "error",
      });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Password baru minimal 8 karakter.",
        type: "error",
      });
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

      // Refresh profile data dari context
      await refreshProfile();

      setAlertConfig({
        visible: true,
        title: "Berhasil",
        message: "Profil berhasil diperbarui.",
        type: "success",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setImageFile(null);

      // Redirect setelah alert ditutup
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Update profile error:", error);

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        let errorMessage = errorData?.message || "Terjadi kesalahan saat memperbarui profil.";
        const errors = errorData?.errors;
        const status = error.response?.status;

        console.error("Error response:", {
          status,
          message: errorMessage,
          errors,
          data: errorData,
        });

        // Handle validation errors
        if (errors) {
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join("\n");
        }

        let title = "Gagal";
        if (status === 422) {
          title = "Validasi Gagal";
        } else if (status === 403) {
          title = "Akses Ditolak";
        } else if (status === 500) {
          title = "Error Server";
          errorMessage = "Terjadi kesalahan di server. Silakan coba lagi atau hubungi administrator.";
        }

        setAlertConfig({
          visible: true,
          title,
          message: errorMessage,
          type: "error",
        });
      } else {
        setAlertConfig({
          visible: true,
          title: "Error",
          message: "Terjadi kesalahan yang tidak terduga.",
          type: "error",
        });
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
            <ThemedText style={styles.profileTitle}>Edit Profile</ThemedText>

            <View style={styles.avatarContainer}>
              <Image source={profileImage ? { uri: profileImage } : require("../../assets/images/unnamed.jpg")} style={styles.avatar} />
              <TouchableOpacity style={styles.editImageButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={0}>
              <ScrollView style={{ flex: 1, width: "100%" }} showsVerticalScrollIndicator={false}>
                {/* Nama Lengkap */}
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Nama Lengkap: *</ThemedText>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={fullName} onChangeText={setFullName} placeholder="Masukkan nama lengkap" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Email: *</ThemedText>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Masukkan email" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                  </View>
                </View>

                {/* NIP/Employee ID */}
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>NIP/ID Pegawai:</ThemedText>
                  <View style={[styles.infoBox, styles.disabledBox]}>
                    <TextInput style={[styles.infoText, styles.disabledText]} value={employeeIdNumber} editable={false} placeholder="Belum diisi" placeholderTextColor="rgba(255, 255, 255, 0.3)" />
                  </View>
                </View>

                {/* Posisi/Jabatan */}
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Posisi/Jabatan:</ThemedText>
                  <View style={[styles.infoBox, styles.disabledBox]}>
                    <TextInput style={[styles.infoText, styles.disabledText]} value={position} editable={false} placeholder="Belum diisi" placeholderTextColor="rgba(255, 255, 255, 0.3)" />
                  </View>
                </View>

                {/* Section Ubah Password */}
                <ThemedText style={styles.passwordSectionTitle}>Ubah Password (Opsional)</ThemedText>

                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Password Saat Ini:</ThemedText>
                  <View style={styles.passwordBox}>
                    <TextInput
                      style={styles.passwordInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      placeholder="Masukkan password saat ini"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Password Baru:</ThemedText>
                  <View style={styles.passwordBox}>
                    <TextInput style={styles.passwordInput} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} placeholder="Minimal 8 karakter" placeholderTextColor="rgba(255, 255, 255, 0.5)" />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Konfirmasi Password Baru:</ThemedText>
                  <View style={styles.passwordBox}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPasswordConfirmation}
                      onChangeText={setNewPasswordConfirmation}
                      secureTextEntry={!showNewPasswordConfirmation}
                      placeholder="Konfirmasi password baru"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                    <TouchableOpacity onPress={() => setShowNewPasswordConfirmation(!showNewPasswordConfirmation)} style={styles.eyeIcon}>
                      <Ionicons name={showNewPasswordConfirmation ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={[styles.settingButton, isLoading && styles.disabledButton]} onPress={handleSave} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#1a1a1a" /> : <ThemedText style={styles.settingButtonText}>Simpan Perubahan</ThemedText>}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
                  <ThemedText style={styles.cancelButtonText}>Batal</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>

        {/* CustomAlert */}
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 50,
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
  passwordBox: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    paddingVertical: 10,
  },
  eyeIcon: {
    padding: 8,
  },
  disabledBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    opacity: 0.6,
  },
  disabledText: {
    color: "rgba(255, 255, 255, 0.5)",
  },
});
