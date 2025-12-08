import api from "@/api/axios";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BuatNotifScreen() {
  const params = useLocalSearchParams<{
    id_class: string;
    code_class: string;
    name_subject: string;
    code_subject: string;
  }>();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Peringatan", "Pesan pengumuman tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/announcements", {
        id_class: parseInt(params.id_class),
        title: title.trim() || undefined,
        message: message.trim(),
      });

      Alert.alert("Sukses", "Pengumuman berhasil dibuat dan dikirim", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Gagal membuat pengumuman:", error);
      const errorMessage = error.response?.data?.message || "Gagal membuat pengumuman";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="semibold" style={styles.headerTitle}>
            Buat Pengumuman
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Class Info Card */}
            <View style={styles.classInfoCard}>
              <View style={styles.classInfoHeader}>
                <Ionicons name="school" size={24} color="#015023" />
                <ThemedText style={styles.classInfoTitle}>Pengumuman untuk Kelas</ThemedText>
              </View>
              <View style={styles.classInfoBody}>
                <View style={styles.classCodeBadge}>
                  <ThemedText style={styles.classCodeText}>{params.code_subject}</ThemedText>
                </View>
                <ThemedText variant="bold" style={styles.subjectNameText}>
                  {params.name_subject}
                </ThemedText>
                <ThemedText style={styles.classCodeSubtext}>Kelas {params.code_class}</ThemedText>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <ThemedText style={styles.label}>
                Judul <ThemedText style={styles.optional}>(Opsional)</ThemedText>
              </ThemedText>
              <TextInput style={styles.input} placeholder="Masukkan judul pengumuman..." placeholderTextColor="#999" value={title} onChangeText={setTitle} editable={!isSubmitting} />

              <ThemedText style={styles.label}>
                Pesan <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tulis pesan pengumuman di sini..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!isSubmitting}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#015023" />
                <ThemedText style={styles.infoText}>Pengumuman akan dikirim ke semua mahasiswa di kelas ini</ThemedText>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
              <View style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}>
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#015023" />
                    <ThemedText style={styles.submitButtonText}>Mengirim...</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#015023" />
                    <ThemedText variant="bold" style={styles.submitButtonText}>
                      Kirim Pengumuman
                    </ThemedText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    fontSize: 18,
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  classInfoCard: {
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  classInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#015023",
  },
  classInfoBody: {
    gap: 8,
  },
  classCodeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#015023",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  classCodeText: {
    fontSize: 12,

    color: "#FFFFFF",
  },
  subjectNameText: {
    fontSize: 16,

    color: "#015023",
  },
  classCodeSubtext: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#015023",
    marginBottom: 8,
  },
  optional: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666",
    fontStyle: "italic",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 16,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#015023",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#015023",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#DABC4E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,

    color: "#015023",
  },
});
