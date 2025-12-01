import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function EditProfilScreen() {
  const { user } = useAuth();
  const router = useRouter();

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

      Alert.alert("Sukses", "Profil berhasil diperbarui.", [
        {
          text: "OK",
          onPress: () => router.push("/profil"),
        },
      ]);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Terjadi kesalahan.";
        Alert.alert("Gagal", message);
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

            {/* Form Fields */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={0}>
              <ScrollView style={{ flex: 1, width: "100%" }} showsVerticalScrollIndicator={false}>
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Nama Lengkap:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={fullName} onChangeText={setFullName} />
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Email:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>

                <Text style={styles.passwordSectionTitle}>Ubah Password (Opsional)</Text>
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Password Saat Ini:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                  </View>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Password Baru:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                  </View>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Konfirmasi Password Baru:</Text>
                  <View style={styles.infoBox}>
                    <TextInput style={styles.infoText} value={newPasswordConfirmation} onChangeText={setNewPasswordConfirmation} secureTextEntry />
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.settingButton} onPress={handleSave} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#1a1a1a" /> : <Text style={styles.settingButtonText}>Save Changes</Text>}
                </TouchableOpacity>
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
    // paddingBottom: 10,
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
});
