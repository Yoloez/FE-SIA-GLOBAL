import axios from "axios";
import { Stack, useFocusEffect, useRouter } from "expo-router"; // <-- 1. Impor useRouter
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP Anda
// const IP_ADDRESS = "10.33.65.27"; // Ganti dengan IP Anda

const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

export default function EditProfilScreen() {
  const { user, token } = useAuth();
  const router = useRouter(); // <-- 2. Inisialisasi router

  // State untuk form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fungsi untuk mengambil data profil saat ini
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data;
      setFullName(data.full_name);
      setEmail(data.email);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat data profil.");
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // Fungsi untuk menyimpan perubahan
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: fullName,
        email: email,
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      };

      await axios.put(`${API_BASE_URL}/student/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // --- INI PERBAIKANNYA ---
      // 3. Tambahkan tombol "OK" dengan aksi navigasi di dalam Alert
      Alert.alert("Sukses", "Profil berhasil diperbarui.", [
        {
          text: "OK",
          onPress: () => router.push("/profil"), // Kembali ke halaman sebelumnya (profil)
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
      <View style={[styles.content, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Edit Profil" }} />
      <StatusBar barStyle="light-content" backgroundColor="#1a5f3f" />
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Edit Profile</Text>

          <View style={styles.avatarContainer}>
            <Image source={require("../../assets/images/kairi.png")} style={styles.avatar} />
          </View>

          {/* Form Fields */}
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
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 80,
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
    backgroundColor: "#015023",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileCard: {
    backgroundColor: "#015023",
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
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
    paddingVertical: 10, // Menambah padding vertikal di dalam TextInput
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
    backgroundColor: "#e8d5b7",
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
});
