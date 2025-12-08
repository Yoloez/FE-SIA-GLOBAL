import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { ThemedText } from "../../components/ThemedText";

export default function EditProfilManagerScreen() {
  const params = useLocalSearchParams();

  // State untuk form
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch current profile
  const fetchProfile = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/profile/staff");
      const data = response.data.data;
      setName(data.name);
      setUsername(data.username);
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

  // Pick image from gallery
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

  // Validation
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama tidak boleh kosong");
      return false;
    }
    if (name.trim().length < 4) {
      Alert.alert("Validasi", "Nama minimal 4 karakter");
      return false;
    }
    if (!username.trim()) {
      Alert.alert("Validasi", "Username tidak boleh kosong");
      return false;
    }
    if (username.trim().length < 3) {
      Alert.alert("Validasi", "Username minimal 3 karakter");
      return false;
    }
    // Validasi alpha_dash (huruf, angka, dash, underscore)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      Alert.alert("Validasi", "Username hanya boleh huruf, angka, dash, dan underscore");
      return false;
    }
    return true;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) return;

    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin menyimpan perubahan?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Simpan",
        onPress: async () => {
          setIsLoading(true);
          try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("username", username.trim());

            // Add image if changed
            if (imageFile) {
              formData.append("profile_image", imageFile as any);
            }

            await api.post("/profile/staff", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });

            Alert.alert("Sukses", "Profil berhasil diperbarui.", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          } catch (error) {
            if (axios.isAxiosError(error)) {
              const message = error.response?.data?.message || error.response?.data?.errors || "Terjadi kesalahan.";
              const errorMessage = typeof message === "object" ? JSON.stringify(message) : message;
              Alert.alert("Gagal", errorMessage);
            }
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  if (isFetching) {
    return (
      <View style={styles.containerLoading}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Memuat data...</ThemedText>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.gradientContainer}>
        {/* Fixed Header */}
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <ThemedText variant="semibold" style={styles.headerTitle}>
              Edit Profile
            </ThemedText>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        {/* Scrollable Content */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.profileCard}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <Image source={profileImage ? { uri: profileImage } : require("../../assets/images/unnamed.jpg")} style={styles.avatar} />
                <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                  <Ionicons name="camera" size={20} color="#015023" />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.helperText}>Tap camera icon to change profile picture</ThemedText>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Name */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Full Name *</ThemedText>
                  <ThemedText style={styles.hint}>Minimal 4 karakter</ThemedText>
                  <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Masukkan nama lengkap" placeholderTextColor="#999" editable={!isLoading} />
                </View>

                {/* Username */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Username *</ThemedText>
                  <ThemedText style={styles.hint}>Minimal 3 karakter, hanya huruf, angka, dash, dan underscore</ThemedText>
                  <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Masukkan username" placeholderTextColor="#999" autoCapitalize="none" editable={!isLoading} />
                </View>

                {/* Email - Read Only */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Email</ThemedText>
                  <ThemedText style={styles.hint}>Email tidak dapat diubah</ThemedText>
                  <TextInput style={[styles.input, styles.inputDisabled]} value={email} placeholder="Email" placeholderTextColor="#999" editable={false} />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#015023" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#015023" style={{ marginRight: 8 }} />
                    <ThemedText variant="semibold" style={styles.saveButtonText}>
                      Simpan Perubahan
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
  },
  containerLoading: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
  },
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    padding: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "#DABC4E",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "32%",
    backgroundColor: "#DABC4E",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  helperText: {
    color: "#DABC4E",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    color: "#DABC4E",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#333",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  inputDisabled: {
    backgroundColor: "rgba(200, 200, 200, 0.5)",
    opacity: 0.6,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#DABC4E",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#015023",
    fontSize: 16,
  },
});
