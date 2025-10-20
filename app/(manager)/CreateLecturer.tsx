import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await api.post("/manager/lecturers", {
        name: name,
        username: username,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation,
      });

      Alert.alert("Sukses", `Dosen "${response.data.data.name}" berhasil ditambahkan.`);
      router.back();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Gagal menambah dosen:", error.response?.data);
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
        {/* Icon Plus dengan Circle */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={40} color="#015023" />
          </View>
          <Text style={styles.iconLabel}>Tambah Foto</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name:</Text>
            <TextInput style={styles.input} placeholder="" placeholderTextColor="#rgba(255,255,255,0.5)" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username:</Text>
            <TextInput style={styles.input} placeholder="" placeholderTextColor="#rgba(255,255,255,0.5)" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email:</Text>
            <TextInput style={styles.input} placeholder="" placeholderTextColor="#rgba(255,255,255,0.5)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password:</Text>
            <TextInput style={styles.input} placeholder="" placeholderTextColor="#rgba(255,255,255,0.5)" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password:</Text>
            <TextInput style={styles.input} placeholder="" placeholderTextColor="#rgba(255,255,255,0.5)" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.button} onPress={handleCreateLecturer} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator color="#015023" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    // flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    // paddingTop: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  iconLabel: {
    fontSize: 18,
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
    fontWeight: "400",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: 50,
    borderWidth: 1,
    borderColor: "black",
    paddingHorizontal: 10,
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
  buttonText: {
    color: "#015023",
    fontSize: 18,
    fontWeight: "bold",
  },
});
