import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Modal, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import api from "../../../api/axios";
import { ThemedText } from "../../../components/ThemedText";

const { width } = Dimensions.get("window");

interface Student {
  id_user_si: number;
  nim: string;
  name: string;
  email: string;
  checked: boolean;
}

interface ClassInfo {
  id_class: number;
  code_class: string;
  code_subject: string;
  name_subject: string;
  sks: number;
  dosen: string;
  academic_period: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    class_info: ClassInfo;
    students: Student[];
  };
}

// Custom Modal Components
interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
}

const CustomModal: React.FC<CustomModalProps> = ({ visible, onClose, title, message, type = "info" }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const getIconConfig = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)" };
      case "error":
        return { name: "close-circle", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)" };
      case "warning":
        return { name: "warning", color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)" };
      default:
        return { name: "information-circle", color: "#0EA5E9", bgColor: "rgba(14, 165, 233, 0.1)" };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={[styles.iconHeader, { backgroundColor: iconConfig.bgColor }]}>
              <Ionicons name={iconConfig.name as any} size={48} color={iconConfig.color} />
            </View>

            <ThemedText variant="bold" style={styles.modalTitle}>
              {title}
            </ThemedText>
            <ThemedText style={styles.modalMessage}>{message}</ThemedText>

            <TouchableOpacity style={[styles.modalButton, { backgroundColor: iconConfig.color }]} onPress={onClose} activeOpacity={0.8}>
              <ThemedText variant="semibold" style={styles.modalButtonText}>
                Tutup
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ visible, onClose, onConfirm, title, message, confirmText = "Ya", cancelText = "Batal" }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={[styles.iconHeader, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
              <Ionicons name="help-circle" size={48} color="#0EA5E9" />
            </View>

            <ThemedText variant="bold" style={styles.modalTitle}>
              {title}
            </ThemedText>
            <ThemedText style={styles.modalMessage}>{message}</ThemedText>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.halfButton, styles.cancelButton]} onPress={onClose} activeOpacity={0.8}>
                <ThemedText variant="semibold" style={styles.cancelButtonText}>
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.halfButton, styles.confirmButton]}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <ThemedText variant="semibold" style={styles.confirmButtonText}>
                  {confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function ManualAttendance() {
  const { id_class, id_schedule, pertemuan } = useLocalSearchParams<{
    id_class: string;
    id_schedule: string;
    pertemuan: string;
  }>();

  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Menyimpan checklist state di ref agar persist
  const savedChecklistRef = useRef<{ [key: number]: boolean }>({});

  const fetchClassDetail = useCallback(async () => {
    if (!id_class) return;

    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse>(`lecturer/attendance/classes/${id_class}`);

      if (response.data.status === "success") {
        setClassInfo(response.data.data.class_info);

        // Restore checklist dari ref jika ada
        setStudents(
          response.data.data.students.map((student) => ({
            ...student,
            checked: savedChecklistRef.current[student.id_user_si] || false,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error fetching class detail:", error);
      setModalConfig({
        title: "Terjadi Kesalahan",
        message: error.response?.data?.message || "Gagal memuat data mahasiswa",
        type: "error",
      });
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [id_class]);

  useEffect(() => {
    fetchClassDetail();
  }, [fetchClassDetail]);

  const toggleStudent = (id: number) => {
    setStudents((prevStudents) => {
      const updatedStudents = prevStudents.map((student) => (student.id_user_si === id ? { ...student, checked: !student.checked } : student));

      // Simpan ke ref
      updatedStudents.forEach((student) => {
        savedChecklistRef.current[student.id_user_si] = student.checked;
      });

      return updatedStudents;
    });
  };

  const handleSaveConfirm = () => {
    const checkedStudents = students.filter((s) => s.checked);

    if (checkedStudents.length === 0) {
      setModalConfig({
        title: "Peringatan",
        message: "Pilih minimal 1 mahasiswa untuk presensi",
        type: "warning",
      });
      setModalVisible(true);
      return;
    }

    setConfirmModalVisible(true);
  };

  const handleSave = async () => {
    const checkedStudents = students.filter((s) => s.checked);

    setIsSaving(true);
    try {
      const studentIds = checkedStudents.map((s) => s.id_user_si);

      const response = await api.post(`lecturer/schedules/${id_schedule}/presences`, {
        student_ids: studentIds,
      });

      if (response.data.status === "success") {
        setModalConfig({
          title: "Berhasil!",
          message: `Presensi berhasil disimpan untuk ${checkedStudents.length} mahasiswa`,
          type: "success",
        });
        setModalVisible(true);

        // Tunggu sebentar sebelum kembali
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      setModalConfig({
        title: "Terjadi Kesalahan",
        message: error.response?.data?.message || "Gagal menyimpan presensi",
        type: "error",
      });
      setModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5EFD3" />
            <ThemedText variant="semibold" style={styles.loadingText}>
              Memuat data mahasiswa...
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!classInfo) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="rgba(255,255,255,0.5)" />
            <ThemedText variant="semibold" style={styles.emptyText}>
              Data kelas tidak ditemukan
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const checkedCount = students.filter((s) => s.checked).length;

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Presensi Manual
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Student List Card */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Course Info */}
              <View style={styles.courseInfo}>
                <ThemedText variant="semibold" style={styles.courseTitle}>
                  {classInfo.name_subject}
                </ThemedText>
                <ThemedText style={styles.courseDetail}>Kelas: {classInfo.code_class}</ThemedText>
                <ThemedText style={styles.courseDetail}>Pertemuan: {pertemuan}</ThemedText>
                <View style={styles.studentCountRow}>
                  <ThemedText style={styles.courseDetail}>Mahasiswa: {students.length}</ThemedText>
                  {checkedCount > 0 && (
                    <View style={styles.checkedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <ThemedText style={styles.checkedBadgeText}>{checkedCount} dipilih</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Student List */}
              <View style={styles.studentList}>
                {students.map((student, index) => (
                  <TouchableOpacity key={student.id_user_si} style={[styles.studentItem, index === students.length - 1 && styles.studentItemLast]} onPress={() => toggleStudent(student.id_user_si)} activeOpacity={0.7}>
                    {/* Avatar */}
                    <View style={[styles.avatar, student.checked && styles.avatarChecked]}>
                      <Ionicons name="person" size={24} color={student.checked ? "#10B981" : "#666"} />
                    </View>

                    {/* Info */}
                    <View style={styles.studentInfo}>
                      <ThemedText variant="semibold" style={styles.studentName}>
                        {student.name}
                      </ThemedText>
                      <ThemedText style={styles.studentNim}>{student.nim}</ThemedText>
                    </View>

                    {/* Checkbox */}
                    <View style={[styles.checkbox, student.checked && styles.checkboxChecked]}>{student.checked && <Ionicons name="checkmark" size={18} color="#fff" />}</View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.saveButton, (isSaving || checkedCount === 0) && styles.saveButtonDisabled]} onPress={handleSaveConfirm} disabled={isSaving || checkedCount === 0}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#015023" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#015023" style={{ marginRight: 8 }} />
                  <ThemedText variant="semibold" style={styles.saveButtonText}>
                    Simpan Presensi {checkedCount > 0 && `(${checkedCount})`}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Custom Modals */}
        <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} />

        <ConfirmModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleSave}
          title="Konfirmasi Presensi"
          message={`Simpan presensi untuk ${checkedCount} mahasiswa yang dipilih?`}
          confirmText="Simpan"
          cancelText="Batal"
        />
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
    paddingTop: 50,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#F5EFD3",
    borderRadius: 24,
    padding: 20,
  },
  courseInfo: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(1, 80, 35, 0.1)",
  },
  courseTitle: {
    fontSize: 16,
    color: "#015023",
    marginBottom: 8,
  },
  courseDetail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  studentCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  checkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkedBadgeText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  studentList: {
    // Students container
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(1, 80, 35, 0.08)",
  },
  studentItemLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarChecked: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    color: "#015023",
  },
  studentNim: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#015023",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#F5EFD3",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconHeader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#6B7280",
  },
  confirmButton: {
    backgroundColor: "#0EA5E9",
  },
  confirmButtonText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
});
