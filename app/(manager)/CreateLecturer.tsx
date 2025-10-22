import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function CreateLecturerScreen() {
  const { token } = useAuth();
  const router = useRouter();

  // State untuk setiap input form
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk memilih gambar
  const pickImage = async () => {
    try {
      // Minta permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Izinkan akses ke galeri untuk memilih foto.");
        return;
      }

      // Buka image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar.");
    }
  };

  // Fungsi untuk mengambil foto dengan kamera
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Izinkan akses ke kamera untuk mengambil foto.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Gagal mengambil foto.");
    }
  };

  // Tampilkan pilihan untuk memilih gambar
  const showImageOptions = () => {
    Alert.alert("Pilih Foto", "Pilih sumber foto profil", [
      {
        text: "Galeri",
        onPress: pickImage,
      },
      {
        text: "Kamera",
        onPress: takePhoto,
      },
      {
        text: "Batal",
        style: "cancel",
      },
    ]);
  };

  const handleCreateLecturer = async () => {
    if (!name || !username || !email || !password || !passwordConfirmation) {
      Alert.alert("Input Tidak Valid", "Semua kolom wajib diisi.");
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert("Input Tidak Valid", "Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      // Buat FormData untuk mengirim file
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("password_confirmation", passwordConfirmation);

      // Jika ada gambar, tambahkan ke FormData
      if (profileImage) {
        // Debug log
        console.log("Profile Image URI:", profileImage);

        const filename = profileImage.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // Format yang benar untuk React Native FormData
        const imageFile = {
          uri: profileImage,
          name: filename,
          type: type,
        };

        console.log("Image file object:", imageFile);
        formData.append("profile_image", imageFile as any);
      }

      // Debug: Log FormData contents
      console.log("Sending FormData with image:", profileImage ? "Yes" : "No");

      const response = await api.post("/manager/lecturers", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        transformRequest: (data) => data, // Penting: jangan transform FormData
      });

      Alert.alert("Sukses", `Dosen "${response.data.data.name}" berhasil ditambahkan.`);
      router.back();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Gagal menambah dosen:", error.response?.data);
        console.error("Error details:", error);
        const message = error.response?.data?.message || "Terjadi kesalahan saat menghubungi server.";
        Alert.alert("Gagal", message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          title: "Tambah Dosen",
          presentation: "modal",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerTitleAlign: "left",
        }}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Icon Plus dengan Circle atau Preview Image */}
        <TouchableOpacity style={styles.iconContainer} onPress={showImageOptions} activeOpacity={0.8}>
          <View style={styles.iconCircle}>
            {profileImage ? (
              <>
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </>
            ) : (
              <Ionicons name="person-add" size={40} color="#015023" />
            )}
          </View>
          <Text style={styles.iconLabel}>{profileImage ? "Ubah Foto" : "Tambah Foto"}</Text>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name:</Text>
            <TextInput style={styles.input} placeholder="Masukkan nama lengkap" placeholderTextColor="rgba(255,255,255,0.5)" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username:</Text>
            <TextInput style={styles.input} placeholder="Masukkan username" placeholderTextColor="rgba(255,255,255,0.5)" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email:</Text>
            <TextInput style={styles.input} placeholder="Masukkan email" placeholderTextColor="rgba(255,255,255,0.5)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password:</Text>
            <TextInput style={styles.input} placeholder="Masukkan password" placeholderTextColor="rgba(255,255,255,0.5)" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password:</Text>
            <TextInput style={styles.input} placeholder="Konfirmasi password" placeholderTextColor="rgba(255,255,255,0.5)" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleCreateLecturer} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator color="#015023" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    overflow: "hidden",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#015023",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  iconLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#fff",
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#FFD43B",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#015023",
    fontSize: 18,
    fontWeight: "bold",
  },
});
