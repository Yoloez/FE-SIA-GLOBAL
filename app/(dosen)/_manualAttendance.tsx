import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import api from "../../api/axios";
import { ThemedText } from "../../components/ThemedText";

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

  const fetchClassDetail = useCallback(async () => {
    if (!id_class) return;

    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse>(`lecturer/attendance/classes/${id_class}`);

      if (response.data.status === "success") {
        setClassInfo(response.data.data.class_info);
        setStudents(
          response.data.data.students.map((student) => ({
            ...student,
            checked: false,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error fetching class detail:", error);
      Alert.alert("Error", error.response?.data?.message || "Gagal memuat data mahasiswa");
    } finally {
      setIsLoading(false);
    }
  }, [id_class]);

  useEffect(() => {
    fetchClassDetail();
  }, [fetchClassDetail]);

  const toggleStudent = (id: number) => {
    setStudents(students.map((student) => (student.id_user_si === id ? { ...student, checked: !student.checked } : student)));
  };

  const handleSave = async () => {
    const checkedStudents = students.filter((s) => s.checked);

    if (checkedStudents.length === 0) {
      Alert.alert("Peringatan", "Pilih minimal 1 mahasiswa untuk presensi");
      return;
    }

    Alert.alert("Konfirmasi", `Simpan presensi untuk ${checkedStudents.length} mahasiswa?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Simpan",
        onPress: async () => {
          setIsSaving(true);
          try {
            const studentIds = checkedStudents.map((s) => s.id_user_si);

            const response = await api.post(`lecturer/schedules/${id_schedule}/presences`, {
              student_ids: studentIds,
            });

            if (response.data.status === "success") {
              Alert.alert("Berhasil", "Presensi manual berhasil disimpan", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            }
          } catch (error: any) {
            console.error("Error saving attendance:", error);
            Alert.alert("Error", error.response?.data?.message || "Gagal menyimpan presensi");
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
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
                <ThemedText style={styles.courseDetail}>Mahasiswa: {students.length}</ThemedText>
              </View>

              {/* Student List */}
              <View style={styles.studentList}>
                {students.map((student) => (
                  <TouchableOpacity key={student.id_user_si} style={styles.studentItem} onPress={() => toggleStudent(student.id_user_si)} activeOpacity={0.7}>
                    {/* Avatar */}
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>

                    {/* Info */}
                    <View style={styles.studentInfo}>
                      <ThemedText variant="semibold" style={styles.studentName}>
                        {student.name}
                      </ThemedText>
                      <ThemedText style={styles.studentNim}>{student.nim}</ThemedText>
                    </View>

                    {/* Checkbox */}
                    <View style={[styles.checkbox, student.checked && styles.checkboxChecked]}>{student.checked && <Ionicons name="checkmark" size={18} color="#015023" />}</View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <ThemedText variant="semibold" style={styles.saveButtonText}>
                  Simpan Presensi
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  studentList: {
    // Students container
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingVertical: 4,
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
    borderColor: "#015023",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#DABC4E",
    borderColor: "#DABC4E",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  saveButtonDisabled: {
    opacity: 0.6,
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
});
