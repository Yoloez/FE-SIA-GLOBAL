import api from "@/api/axios";
import CustomAlert from "@/components/CustomAlert";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotificationProps {
  viewMode?: "admin" | "manager";
  onBack?: () => void;
}

export default function NotificationScreen({ viewMode, onBack }: NotificationProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CustomAlert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onClose: () => {},
  });

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info", onClose?: () => void) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onClose: onClose || (() => setAlertConfig({ ...alertConfig, visible: false })),
    });
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      showAlert("Peringatan", "Pesan pengumuman tidak boleh kosong", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/announcements", {
        title: title.trim() || undefined,
        message: message.trim(),
        // Tidak ada id_class karena ini broadcast announcement
      });

      showAlert("Sukses", `Pengumuman berhasil dibuat dan dikirim ke ${response.data.data.recipients_count} pengguna`, "success", () => {
        setAlertConfig({ ...alertConfig, visible: false });
        // Reset form
        setTitle("");
        setMessage("");
      });
    } catch (error: any) {
      console.error("Gagal membuat pengumuman:", error);
      const errorMessage = error.response?.data?.message || "Gagal membuat pengumuman";
      showAlert("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Buat Pengumuman
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Broadcast Info Card */}
            <View style={styles.broadcastInfoCard}>
              <View style={styles.broadcastInfoHeader}>
                <LinearGradient colors={["#DABC4E", "#C4A83E"]} style={styles.broadcastIconGradient}>
                  <Ionicons name="megaphone" size={28} color="#015023" />
                </LinearGradient>
                <View style={styles.broadcastInfoContent}>
                  <ThemedText variant="bold" style={styles.broadcastInfoTitle}>
                    Pengumuman Broadcast
                  </ThemedText>
                  <ThemedText style={styles.broadcastInfoSubtitle}>Akan dikirim ke semua pengguna aktif</ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="people" size={18} color="#015023" />
                </View>
                <ThemedText style={styles.infoText}>Semua mahasiswa, dosen, manager, dan admin akan menerima pengumuman ini</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="notifications" size={18} color="#015023" />
                </View>
                <ThemedText style={styles.infoText}>Notifikasi akan dikirim secara real-time</ThemedText>
              </View>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <ThemedText variant="semibold" style={styles.label}>
                Judul <ThemedText style={styles.optional}>(Opsional)</ThemedText>
              </ThemedText>
              <TextInput style={styles.input} placeholder="Masukkan judul pengumuman..." placeholderTextColor="#999" value={title} onChangeText={setTitle} editable={!isSubmitting} />

              <ThemedText variant="semibold" style={styles.label}>
                Pesan <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tulis pesan pengumuman di sini..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                editable={!isSubmitting}
              />

              <View style={styles.tipBox}>
                <Ionicons name="bulb" size={20} color="#f59e0b" />
                <ThemedText style={styles.tipText}>Pastikan pesan jelas dan mudah dipahami oleh semua penerima</ThemedText>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8} style={styles.submitButtonContainer}>
              <View style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}>
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#015023" />
                    <ThemedText variant="bold" style={styles.submitButtonText}>
                      Mengirim...
                    </ThemedText>
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

        {/* CustomAlert */}
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={alertConfig.onClose} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
    fontSize: 20,
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  broadcastInfoCard: {
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
  broadcastInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  broadcastIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  broadcastInfoContent: {
    flex: 1,
  },
  broadcastInfoTitle: {
    fontSize: 16,
    color: "#015023",
    marginBottom: 4,
  },
  broadcastInfoSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#015023",
    lineHeight: 18,
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
    fontSize: 14,
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
    fontFamily: "Urbanist",
  },
  textArea: {
    minHeight: 160,
    paddingTop: 12,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 16,
  },
  submitButtonContainer: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#DABC4E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#015023",
  },
});
