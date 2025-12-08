import React, { useEffect, useState } from "react";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface EditSubjectProps {
  viewMode: "admin" | "manager";
  subjectId: string;
  initialData: {
    name_subject: string;
    code_subject: string;
    sks: string;
    semester?: string;
  };
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function EditSubject({ viewMode, subjectId, initialData, onBack, onSuccess }: EditSubjectProps) {
  const { token } = useAuth();

  const [subjectName, setSubjectName] = useState(initialData.name_subject || "");
  const [subjectCode, setSubjectCode] = useState(initialData.code_subject || "");
  const [subjectSks, setSubjectSks] = useState(initialData.sks || "");
  const [isLoading, setIsLoading] = useState(false);

  // Log initial data
  useEffect(() => {
    console.log("Initial data received:", initialData);
    setSubjectName(initialData.name_subject || "");
    setSubjectCode(initialData.code_subject || "");
    setSubjectSks(initialData.sks || "");
  }, [initialData]);

  const handleSave = async () => {
    if (!subjectName.trim() || !subjectCode.trim() || !subjectSks.trim()) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    if (!subjectId) {
      Alert.alert("Error", "ID mata kuliah tidak ditemukan");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        name_subject: subjectName.trim(),
        code_subject: subjectCode.trim(),
        sks: parseInt(subjectSks, 10),
      };

      console.log("Sending update to:", `/subjects/${subjectId}`);
      console.log("Update data:", updateData);

      const response = await api.put(`manager/subjects/${subjectId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Update response:", response.data);

      Alert.alert("Sukses", "Mata kuliah berhasil diperbarui", [{ text: "OK", onPress: () => onSuccess?.() }]);
    } catch (err: any) {
      console.error("Error details:", err.response?.data || err);

      let errorMsg = "Gagal memperbarui mata kuliah";

      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMsg = Object.values(errors).flat().join("\n");
      } else if (err.message) {
        errorMsg = err.message;
      }

      Alert.alert("Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Course Name</Text>
        <TextInput style={styles.input} placeholder="Masukkan nama mata kuliah" placeholderTextColor="#d5e6db" value={subjectName} onChangeText={setSubjectName} editable={!isLoading} />

        <Text style={styles.label}>Subject Code</Text>
        <TextInput style={styles.input} placeholder="Masukkan kode mata kuliah" placeholderTextColor="#d5e6db" value={subjectCode} onChangeText={setSubjectCode} editable={!isLoading} />

        <Text style={styles.label}>SKS</Text>
        <TextInput style={styles.input} placeholder="Masukkan jumlah SKS" placeholderTextColor="#d5e6db" value={subjectSks} onChangeText={setSubjectSks} keyboardType="numeric" editable={!isLoading} />

        <TouchableOpacity style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]} onPress={handleSave} disabled={isLoading}>
          <Text style={styles.saveText}>{isLoading ? "Menyimpan..." : "Save"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a5c3a",
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  label: {
    color: "#e9f5ef",
    fontSize: 15,
    marginTop: 18,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  saveBtn: {
    marginTop: 40,
    marginBottom: 35,
    backgroundColor: "#e8c468",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#a9a9a9",
  },
  saveText: {
    color: "#1a5c3a",
    fontWeight: "700",
    fontSize: 16,
  },
});
