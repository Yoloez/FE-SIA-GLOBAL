import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/axios";

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
  const [classInfo, setClassInfo] = useState({ name: "", code: "", studentCount: 0 });

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
        Alert.alert("Error", "Format data mahasiswa tidak valid.");
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
      Alert.alert("Gagal", "Gagal memuat data mahasiswa atau mata kuliah.");
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
  };

  const handleSaveGrade = async (studentId: number, subjectId: number, grade: string) => {
    if (!grade || grade === "") {
      Alert.alert("Input Tidak Valid", "Masukkan nilai terlebih dahulu (0-100).");
      return;
    }

    const numericGrade = parseInt(grade);

    if (numericGrade < 0 || numericGrade > 100) {
      Alert.alert("Input Tidak Valid", "Nilai harus antara 0-100.");
      return;
    }

    try {
      const response = await api.post("/lecturer/grades", {
        id_user_si: studentId,
        id_subject: subjectId,
        grade: numericGrade,
      });

      const responseData = response.data.data;

      Alert.alert("Sukses", `Nilai berhasil disimpan!\n\nAngka: ${responseData.score}\nHuruf: ${responseData.letter}\nIP: ${responseData.ip}`);

      // Update state dengan data terbaru dari response
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id_user_si === studentId
            ? {
                ...student,
                grade: {
                  grade: responseData.score,
                  letter: responseData.letter,
                  ip_skor: responseData.ip,
                },
              }
            : student
        )
      );
    } catch (error: any) {
      const message = error.response?.data?.message || "Gagal menyimpan nilai.";
      Alert.alert("Gagal", message);
    }
  };

  const renderItem = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentLeft}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={28} color="#4a4a4a" />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentId}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {/* Display Nilai yang sudah tersimpan */}
        <View style={styles.gradeDisplayContainer}>
          {item.grade ? (
            <View style={styles.gradeDisplayContent}>
              {/* <Text style={styles.gradeDisplayNumber}>{item.grade.grade}</Text> */}
              <Text style={styles.gradeDisplayLetter}>({item.grade.letter})</Text>
            </View>
          ) : (
            <Text style={styles.gradeDisplayText}>--</Text>
          )}
        </View>

        {/* Input Nilai Angka */}
        <View style={styles.inputWrapper}>
          <TextInput style={styles.gradeInput} value={item.selectedGrade} onChangeText={(text) => handleGradeChange(item.id_user_si, text)} keyboardType="numeric" placeholder="0-100" placeholderTextColor="#999" maxLength={3} />
        </View>

        {/* Tombol Simpan */}
        <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveGrade(item.id_user_si, item.id_subject, item.selectedGrade)} activeOpacity={0.7}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />

        <ImageBackground source={require("../../../assets/images/batik.png")} style={styles.headerBackground} imageStyle={styles.headerBackgroundImage}>
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push("../grades")} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#2d5f3f" />
            </TouchableOpacity>

            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>Course</Text>
            </View>

            <Text style={styles.courseTitle}>{classInfo.name}</Text>
            <Text style={styles.courseCode}>{classInfo.code}</Text>

            <View style={styles.studentCountContainer}>
              <Ionicons name="people" size={16} color="#2d5f3f" />
              <Text style={styles.studentCountText}>{classInfo.studentCount} Student</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.contentContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Daftar Nilai Mahasiswa</Text>
            <Text style={styles.listHeaderSubtext}>Masukkan nilai 0-100</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d5f3f" />
              <Text style={styles.loadingText}>Memuat data mahasiswa...</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              renderItem={renderItem}
              keyExtractor={(item) => item.id_user_si.toString()}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color="#999" />
                  <Text style={styles.emptyText}>Belum ada mahasiswa di kelas ini</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a5230" },
  safeArea: { flex: 1 },
  headerBackground: { width: "100%", paddingTop: 10, paddingBottom: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerBackgroundImage: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, opacity: 0.45 },
  headerOverlay: { position: "relative", paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(229, 220, 200, 0.9)", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  courseBadge: { alignSelf: "flex-start", backgroundColor: "#2d5f3f", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15, marginBottom: 12 },
  courseBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  courseTitle: { fontSize: 18, fontWeight: "700", color: "#ffffff", marginBottom: 6 },
  courseCode: { fontSize: 13, color: "#e5dcc8", marginBottom: 12 },
  studentCountContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(229, 220, 200, 0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  studentCountText: { fontSize: 12, color: "#2d5f3f", marginLeft: 4, fontWeight: "600" },
  contentContainer: { flex: 1, backgroundColor: "#1a5230", paddingTop: 10 },
  listHeader: { backgroundColor: "#c9b872", paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 20, marginBottom: 15, borderRadius: 20 },
  listHeaderText: { fontSize: 15, fontWeight: "700", color: "#2d5f3f" },
  listHeaderSubtext: { fontSize: 12, color: "#2d5f3f", marginTop: 2, opacity: 0.8 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  studentCard: { backgroundColor: "#e5dcc8", borderRadius: 15, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  studentLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarContainer: { width: 45, height: 45, borderRadius: 10, backgroundColor: "#d4cbb8", justifyContent: "center", alignItems: "center", marginRight: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: "700", color: "#2d2d2d", marginBottom: 3 },
  studentId: { fontSize: 11, color: "#5a5a5a" },
  actionsContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  gradeDisplayContainer: { width: 35, height: 44, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#c9b872", justifyContent: "center", alignItems: "center" },
  gradeDisplayContent: { alignItems: "center" },
  gradeDisplayNumber: { fontSize: 16, fontWeight: "700", color: "#2d5f3f" },
  gradeDisplayLetter: { fontSize: 15, fontWeight: "600", color: "#c9b872", marginTop: -2, paddingHorizontal: 0 },
  gradeDisplayText: { fontSize: 16, fontWeight: "700", color: "#2d5f3f" },
  inputWrapper: { backgroundColor: "#ffffff", borderRadius: 10, borderWidth: 2, borderColor: "#2d5f3f", overflow: "hidden", height: 44, width: 70, justifyContent: "center" },
  gradeInput: { textAlign: "center", fontSize: 16, fontWeight: "600", color: "#2d5f3f", paddingHorizontal: 8, height: 44 },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2d5f3f",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#e5dcc8", fontWeight: "500" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { textAlign: "center", marginTop: 16, color: "#e5dcc8", fontSize: 15 },
});
