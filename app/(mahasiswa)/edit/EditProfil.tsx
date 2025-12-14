import api from "@/api/axios";
import CustomAlert from "@/components/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";
import { useAuth } from "../../../context/AuthContext";
import { useStudentData } from "../../../context/StudentDataContext";

export default function EditProfilScreen() {
  const { user } = useAuth();
  const { refreshProfile } = useStudentData();
  const router = useRouter();
  const navigation = useNavigation();

  // Hide tab bar when this screen is focused
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: "none" },
      });
    }
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderColor: "#DABC4E",
            elevation: 0,
            borderTopWidth: 0,
            backgroundColor: "transparent",
            height: 75,
            paddingTop: 10,
          },
        });
      }
    };
  }, [navigation]);

  // State untuk form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
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
      const response = await api.get("/student/profile/identity");
      const data = response.data.data;
      setFullName(data.full_name);
      setEmail(data.email);
      setProfileImage(data.profile_image);
    } catch (error) {
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
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Izinkan akses ke galeri untuk mengganti foto profil.");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setProfileImage(asset.uri);
        setImageFile({
          uri: asset.uri,
          type: "image/jpeg",
          name: `profile_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar.");
    }
  };

  // Fungsi untuk menyimpan perubahan
  const handleSave = async () => {
    // Validasi konfirmasi password
    if (newPassword && newPassword !== newPasswordConfirmation) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Password baru dan konfirmasi password tidak cocok.",
        type: "error",
      });
      return;
    }

    // Validasi jika mengisi password baru harus mengisi current password
    if (newPassword && !currentPassword) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Masukkan password saat ini untuk mengubah password.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);

      if (currentPassword) {
        formData.append("current_password", currentPassword);
      }
      if (newPassword) {
        formData.append("new_password", newPassword);
      }
      if (newPasswordConfirmation) {
        formData.append("new_password_confirmation", newPasswordConfirmation);
      }

      // Tambahkan image jika ada perubahan
      if (imageFile) {
        formData.append("profile_image", imageFile as any);
      }

      await api.post("/student/profile/identity", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh profile data dari context
      await refreshProfile();

      setAlertConfig({
        visible: true,
        title: "Berhasil",
        message: "Profil berhasil diperbarui.",
        type: "success",
      });

      // Redirect setelah alert ditutup
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        let errorMessage = errorData?.message || "Terjadi kesalahan.";

        // Handle validation errors
        if (errorData?.errors) {
          const errors = Object.values(errorData.errors).flat();
          errorMessage = errors.join("\n");
        }

        setAlertConfig({
          visible: true,
          title: "Gagal",
          message: errorMessage,
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
            <ThemedText variant="semibold" style={styles.profileTitle}>
              Edit Profile
            </ThemedText>

            <View style={styles.avatarContainer}>
              <Image source={profileImage ? { uri: profileImage } : require("@/assets/images/unnamed.jpg")} style={styles.avatar} />
              <TouchableOpacity style={styles.editImageButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={0}>
              <ScrollView style={{ flex: 1, width: "100%" }} showsVerticalScrollIndicator={false}>
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Nama Lengkap:</ThemedText>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={fullName} onChangeText={setFullName} />
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Email:</ThemedText>
                  <View style={[styles.infoBox, styles.disabledBox]}>
                    <TextInput style={[styles.infoText, styles.disabledText]} value={email} editable={false} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>

                <ThemedText variant="semibold" style={styles.passwordSectionTitle}>
                  Ubah Password (Opsional)
                </ThemedText>
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Password Saat Ini:</ThemedText>
                  <View style={styles.passwordBox}>
                    <TextInput style={styles.passwordInput} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Password Baru:</ThemedText>
                  <View style={styles.passwordBox}>
                    <TextInput style={styles.passwordInput} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.infoContainer}>
                  <ThemedText style={styles.label}>Konfirmasi Password Baru:</ThemedText>
                  <View style={styles.passwordBox}>
                    <TextInput style={styles.passwordInput} value={newPasswordConfirmation} onChangeText={setNewPasswordConfirmation} secureTextEntry={!showNewPasswordConfirmation} />
                    <TouchableOpacity onPress={() => setShowNewPasswordConfirmation(!showNewPasswordConfirmation)} style={styles.eyeIcon}>
                      <Ionicons name={showNewPasswordConfirmation ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.settingButton} onPress={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#1a1a1a" />
                  ) : (
                    <ThemedText variant="semibold" style={styles.settingButtonText}>
                      Simpan Perubahan
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.push("/(mahasiswa)/profil")} disabled={isLoading}>
                  <ThemedText variant="semibold" style={styles.cancelButtonText}>
                    Batal
                  </ThemedText>
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
    backgroundColor: "transparent",
  },
  containerLoading: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  editButton: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileCard: {
    borderRadius: 0,
    padding: 30,
    paddingTop: 45,
    paddingBottom: 40,
    flex: 1,
  },
  profileTitle: {
    color: "#ffffff",
    fontSize: 20,
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
  disabledBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    opacity: 0.6,
  },
  disabledText: {
    color: "rgba(255, 255, 255, 0.5)",
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
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 10,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  navIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 24,
  },
  navButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  passwordSectionTitle: {
    color: "#DABC4E",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 15,
  },
  keyboardView: {
    flex: 1,
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
});
