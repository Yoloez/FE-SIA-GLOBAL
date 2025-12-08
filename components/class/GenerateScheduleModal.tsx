import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import CalendarPicker from "./CalendarPicker";

interface GenerateScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (startDate: string, jumlahPertemuan: number) => Promise<void>;
}

export default function GenerateScheduleModal({ visible, onClose, onGenerate }: GenerateScheduleModalProps) {
  const [startDate, setStartDate] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [jumlahPertemuan, setJumlahPertemuan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = date.toISOString().split("T")[0];
    setStartDate(formattedDate);
    setShowDatePicker(false);
  };

  const handleGenerate = async () => {
    const jumlah = parseInt(jumlahPertemuan);
    setIsGenerating(true);
    try {
      await onGenerate(startDate, jumlah);
      // Reset form
      setStartDate("");
      setSelectedDate(new Date());
      setJumlahPertemuan("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setStartDate("");
    setSelectedDate(new Date());
    setJumlahPertemuan("");
    setShowDatePicker(false);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="bold" style={styles.modalTitle}>
                Generate Jadwal Pertemuan
              </ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.modalDescription}>Generate jadwal pertemuan untuk kelas ini secara otomatis berdasarkan hari kelas dan tanggal mulai.</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.inputLabel}>
                  Tanggal Mulai
                </ThemedText>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <ThemedText style={styles.datePickerText}>{startDate ? formatDisplayDate(startDate) : "Pilih tanggal mulai"}</ThemedText>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText variant="semibold" style={styles.inputLabel}>
                  Jumlah Pertemuan
                </ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="list-outline" size={20} color="#6b7280" />
                  <TextInput style={styles.modalInput} placeholder="Masukkan jumlah pertemuan" placeholderTextColor="#9ca3af" keyboardType="numeric" value={jumlahPertemuan} onChangeText={setJumlahPertemuan} />
                </View>
                <ThemedText style={styles.inputHint}>Maksimal 20 pertemuan</ThemedText>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={handleClose} style={styles.modalCancelButton}>
                <ThemedText variant="semibold" style={styles.modalCancelText}>
                  Batal
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleGenerate} style={[styles.modalGenerateButton, isGenerating && styles.modalGenerateButtonDisabled]} disabled={isGenerating}>
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#015023" />
                ) : (
                  <>
                    <Ionicons name="calendar" size={18} color="#015023" />
                    <ThemedText variant="bold" style={styles.modalGenerateText}>
                      Generate
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CalendarPicker visible={showDatePicker} selectedDate={selectedDate} onDateSelect={handleDateSelect} onClose={() => setShowDatePicker(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#015023",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    gap: 8,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
    fontFamily: "Urbanist",
  },
  inputHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalGenerateButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#DABC4E",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalGenerateButtonDisabled: {
    opacity: 0.6,
  },
  modalGenerateText: {
    fontSize: 14,
    color: "#015023",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
});
