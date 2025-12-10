import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/axios";
import CustomAlert from "../../../components/CustomAlert";
import { ThemedText } from "../../../components/ThemedText";

interface Student {
  id_user_si: number;
  name: string;
  email: string;
  grade: { grade: number; letter: string; ip_skor: number } | null;
  id_subject: number;
  selectedGrade: string;
}

export default function GradeInputScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [classInfo, setClassInfo] = useState({ name: "", code: "", studentCount: 0 });

  // CustomAlert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as { text: string; onPress: () => void; style?: "cancel" | "destructive" }[],
  });

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsResponse, subjectsResponse] = await Promise.all([api.get(`/lecturer/classes/${classId}/students`), api.get("/lecturer/classes")]);
      const responseData = studentsResponse.data.data;
      const subjectsData = subjectsResponse.data.data;

      // Ambil students dari responseData.students
      const studentsArray = responseData?.students || [];
      const classInfo = responseData?.class_info;

      // Validasi bahwa studentsArray adalah array
      if (!Array.isArray(studentsArray)) {
        console.error("students bukan array:", studentsArray);
        setStudents([]);
        setIsLoading(false);
        return;
      }

      setStudents(
        studentsArray.map((student: any) => ({
          ...student,
          email: student.nim || student.email || "",
          selectedGrade: student.grade ? student.grade.grade.toString() : "",
        }))
      );

      // Gunakan informasi kelas dari class_info di response
      if (classInfo && classInfo.subject) {
        setClassInfo({
          name: classInfo.subject.name || "Mata Kuliah",
          code: classInfo.subject.code || classInfo.code_class || "",
          studentCount: responseData.statistics?.total_students || studentsArray.length,
        });
      } else {
        // Fallback ke cara lama jika class_info tidak ada
        const subject = Array.isArray(subjectsData) ? subjectsData.find((s: any) => s.id_subject === Number(classId)) : null;
        setClassInfo({
          name: subject?.name || "Mata Kuliah",
          code: subject?.code || "",
          studentCount: studentsArray.length,
        });
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleGradeChange = (studentId: number, grade: string) => {
    // Validasi input: hanya angka 0-100
    const numericValue = grade.replace(/[^0-9]/g, "");
    const numValue = parseInt(numericValue);

    // Batasi max 100
    let finalValue = numericValue;
    if (numValue > 100) {
      finalValue = "100";
    }

    setStudents((prevStudents) => prevStudents.map((student) => (student.id_user_si === studentId ? { ...student, selectedGrade: finalValue } : student)));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    // Filter students yang ada perubahan nilai
    const studentsToSave = students.filter((student) => student.selectedGrade && student.selectedGrade !== "");

    if (studentsToSave.length === 0) {
      setAlertConfig({
        visible: true,
        title: "Tidak Ada Perubahan",
        message: "Belum ada nilai yang diinput.",
        buttons: [{ text: "OK", onPress: () => {} }],
      });
      return;
    }

    // Validasi semua nilai
    const invalidGrades = studentsToSave.filter((student) => {
      const grade = parseInt(student.selectedGrade);
      return isNaN(grade) || grade < 0 || grade > 100;
    });

    if (invalidGrades.length > 0) {
      setAlertConfig({
        visible: true,
        title: "Input Tidak Valid",
        message: "Pastikan semua nilai yang diinput antara 0-100.",
        buttons: [{ text: "OK", onPress: () => {} }],
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save all grades
      const savePromises = studentsToSave.map((student) =>
        api.post("/lecturer/grades", {
          id_user_si: student.id_user_si,
          id_subject: student.id_subject,
          grade: parseInt(student.selectedGrade),
        })
      );

      const responses = await Promise.all(savePromises);

      // Update state dengan data terbaru dari response
      setStudents((prevStudents) =>
        prevStudents.map((student) => {
          const responseIndex = studentsToSave.findIndex((s) => s.id_user_si === student.id_user_si);
          if (responseIndex !== -1) {
            const responseData = responses[responseIndex].data.data;
            return {
              ...student,
              grade: {
                grade: responseData.score,
                letter: responseData.letter,
                ip_skor: responseData.ip,
              },
              selectedGrade: "",
            };
          }
          return student;
        })
      );

      setHasChanges(false);

      setAlertConfig({
        visible: true,
        title: "Sukses! ✓",
        message: `${studentsToSave.length} nilai berhasil disimpan.`,
        buttons: [{ text: "OK", onPress: () => {} }],
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Gagal menyimpan nilai.";
      setAlertConfig({
        visible: true,
        title: "Gagal",
        message: message,
        buttons: [{ text: "OK", onPress: () => {} }],
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Student }) => (
    <ImageBackground source={require("../../../assets/images/batik.png")} style={styles.studentCard} imageStyle={styles.cardImage} resizeMode="cover">
      <View style={styles.cardContent}>
        <View style={styles.studentLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={28} color="#015023" />
          </View>
          <View style={styles.studentInfo}>
            <ThemedText variant="bold" style={styles.studentName}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.studentId}>{item.email}</ThemedText>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {/* Display Nilai yang sudah tersimpan */}
          <View style={styles.gradeDisplayContainer}>
            {item.grade ? (
              <View style={styles.gradeDisplayContent}>
                <ThemedText variant="bold" style={styles.gradeDisplayLetter}>
                  {item.grade.letter}
                </ThemedText>
              </View>
            ) : (
              <ThemedText variant="medium" style={styles.gradeDisplayText}>
                --
              </ThemedText>
            )}
          </View>

          {/* Input Nilai Angka */}
          <View style={styles.inputWrapper}>
            <TextInput style={styles.gradeInput} value={item.selectedGrade} onChangeText={(text) => handleGradeChange(item.id_user_si, text)} keyboardType="numeric" placeholder="0-100" placeholderTextColor="#999" maxLength={3} />
          </View>
        </View>
      </View>
    </ImageBackground>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />

        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <ThemedText variant="bold" style={styles.headerTitle}>
                {classInfo.name}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>{classInfo.code}</ThemedText>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.studentCountBadge}>
                <Ionicons name="people" size={14} color="#015023" />
                <ThemedText variant="semibold" style={styles.studentCountText}>
                  {classInfo.studentCount}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DABC4E" />
              <ThemedText style={styles.loadingText}>Memuat data mahasiswa...</ThemedText>
            </View>
          ) : (
            <>
              <FlatList
                data={students}
                renderItem={renderItem}
                keyExtractor={(item) => item.id_user_si.toString()}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    <ThemedText variant="bold" style={styles.listHeaderText}>
                      Daftar Nilai Mahasiswa
                    </ThemedText>
                    <ThemedText style={styles.listHeaderSubtext}>Masukkan nilai 0-100, lalu simpan</ThemedText>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                    <ThemedText variant="medium" style={styles.emptyText}>
                      Belum ada mahasiswa di kelas ini
                    </ThemedText>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />

              {/* Floating Save Button */}
              {hasChanges && (
                <View style={styles.floatingButtonContainer}>
                  <TouchableOpacity style={styles.floatingSaveButton} onPress={handleSaveAll} activeOpacity={0.8} disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#015023" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color="#015023" />
                        <ThemedText variant="bold" style={styles.floatingSaveButtonText}>
                          Simpan Semua Nilai
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </LinearGradient>

        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#015023" },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  studentCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DABC4E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  studentCountText: {
    fontSize: 12,
    color: "#015023",
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  listHeaderText: {
    fontSize: 16,
    color: "#ffffff",
  },
  listHeaderSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  studentCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardImage: {
    borderRadius: 16,
    opacity: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  studentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(218, 188, 78, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    color: "#2C3E50",
    marginBottom: 3,
  },
  studentId: {
    fontSize: 12,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gradeDisplayContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 2,
    borderColor: "#DABC4E",
    justifyContent: "center",
    alignItems: "center",
  },
  gradeDisplayContent: {
    alignItems: "center",
  },
  gradeDisplayLetter: {
    fontSize: 16,
    color: "#015023",
  },
  gradeDisplayText: {
    fontSize: 16,
    color: "#999",
  },
  inputWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#015023",
    overflow: "hidden",
    height: 42,
    width: 70,
    justifyContent: "center",
  },
  gradeInput: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#015023",
    paddingHorizontal: 8,
    height: 42,
    fontFamily: "Urbanist",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1C352D",
    borderTopWidth: 1,
    borderTopColor: "rgba(218, 188, 78, 0.3)",
  },
  floatingSaveButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingSaveButtonText: {
    color: "#1C352D",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: "#fff",
    fontSize: 15,
  },
});
