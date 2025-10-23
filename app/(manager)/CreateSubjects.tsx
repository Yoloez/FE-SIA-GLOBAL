import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function CreateSubjectScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [nameSubject, setNameSubject] = useState("");
  const [codeSubject, setCodeSubject] = useState("");
  const [sks, setSks] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubject = async () => {
    if (!nameSubject || !codeSubject || !sks) {
      Alert.alert("Error", "Semua kolom wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(
        "/manager/subjects",
        {
          name_subject: nameSubject,
          code_subject: codeSubject,
          sks: parseInt(sks, 10),
        }
      );

      Alert.alert("Sukses", `Mata kuliah "${response.data.data.name_subject}" berhasil ditambahkan.`);
      router.back();
    } catch (error) {
      console.error("Gagal menambah mata kuliah:", error);

      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 422) {
          const errors = error.response.data.errors;
        } else if (error.response.status === 403) {
          errorMessage = "Anda tidak memiliki hak akses untuk melakukan aksi ini.";
        }
      }
      Alert.alert("Gagal", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tambah Mata Kuliah</Text>
          
        </View>

        {/* Add Icon Button */}
        <View style={styles.addIconContainer}>
          <View style={styles.addIconCircle}>
            <Ionicons name="add" size={32} color="#ffffff" />
          </View>
          <Text style={styles.addText}>Tambah Mata Kuliah</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Nama Mata Kuliah:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Contoh: Pemrograman Web Lanjut" 
            placeholderTextColor="#rgba(255,255,255,0.5)"
            value={nameSubject} 
            onChangeText={setNameSubject} 
          />

          <Text style={styles.label}>Kode Mata Kuliah:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Contoh IF-212" 
            placeholderTextColor="#rgba(255,255,255,0.5)"
            value={codeSubject} 
            onChangeText={setCodeSubject} 
            autoCapitalize="characters" 
          />

          <Text style={styles.label}>Jumlah SKS:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Contoh 3" 
            placeholderTextColor="#rgba(255,255,255,0.5)"
            value={sks} 
            onChangeText={setSks} 
            keyboardType="numeric" 
          />

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleCreateSubject} 
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1a5230" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a5230",
  },
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
    elevation: 3, // ← ini buat Android
  shadowColor: "#000",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  addIconContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  addIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  addText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  form: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 10,
    fontWeight: "400",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 25,
  },
  saveButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonText: {
    color: "#1a5230",
    fontSize: 18,
    fontWeight: "700",
  },
});