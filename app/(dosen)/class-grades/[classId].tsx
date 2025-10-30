import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/axios";

// Tipe data untuk Mahasiswa
interface Student {
  id: number;
  name: string;
  email: string;
  grade: { grade: string } | null;
  subject_id: number;
  selectedGrade: string;
}

export default function GradeInputScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classInfo, setClassInfo] = useState({ name: "", code: "", studentCount: 0 });

  // Fungsi untuk mengambil daftar mahasiswa
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsResponse, subjectsResponse] = await Promise.all([api.get(`/lecturer/classes/${classId}/students`), api.get("/lecturer/classes")]);

      const studentsData = studentsResponse.data.data;
      const subjectsData = subjectsResponse.data.data;

      setStudents(
        studentsData.map((student: Student) => ({
          ...student,
          selectedGrade: student.grade ? student.grade.grade : "",
        }))
      );

      // Misal kamu mau update info kelas dari subjectsData
      const subject = subjectsData.find((s: any) => s.id === Number(classId));
      setClassInfo({
        name: subject?.name || "Analisis dan Desain Perangkat Lunak",
        code: subject?.code,
        studentCount: studentsData.length,
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Gagal", "Gagal memuat data mahasiswa atau mata kuliah.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fungsi untuk mengubah nilai di state secara lokal
  const handleGradeChange = (studentId: number, grade: string) => {
    setStudents((prevStudents) => prevStudents.map((student) => (student.id === studentId ? { ...student, selectedGrade: grade } : student)));
  };

  // Fungsi untuk menyimpan satu nilai ke database
  const handleSaveGrade = async (studentId: number, subjectId: number, grade: string) => {
    if (!grade) {
      Alert.alert("Input Tidak Valid", "Pilih nilai sebelum menyimpan.");
      return;
    }
    try {
      await api.post("/lecturer/grades", {
        user_si_id: studentId,
        subject_id: subjectId,
        grade: grade,
      });
      Alert.alert("Sukses", "Nilai berhasil disimpan.");
    } catch (error) {
      const message = "Gagal menyimpan nilai.";
      Alert.alert("Gagal", message);
    }
  };

  // Render item untuk FlatList
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
        <View style={styles.gradeDisplayContainer}>
          <Text style={styles.gradeDisplayText}>{item.selectedGrade || "--"}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => handleSaveGrade(item.id, item.subject_id, item.selectedGrade)} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={22} color="#4a4a4a" />
        </TouchableOpacity>

        <View style={styles.pickerWrapper}>
          <Picker selectedValue={item.selectedGrade} style={styles.picker} onValueChange={(itemValue) => handleGradeChange(item.id, itemValue)} dropdownIconColor="#4a4a4a">
            <Picker.Item label="--" value="" />
            <Picker.Item label="A" value="A" />
            <Picker.Item label="A-" value="A-" />
            <Picker.Item label="B+" value="B+" />
            <Picker.Item label="B" value="B" />
            <Picker.Item label="B-" value="B-" />
            <Picker.Item label="C" value="C" />
            <Picker.Item label="D" value="D" />
            <Picker.Item label="E" value="E" />
          </Picker>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header dengan Background Image */}
        <ImageBackground source={require("../../../assets/images/kairi.png")} style={styles.headerBackground} imageStyle={styles.headerBackgroundImage}>
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
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

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Daftar Nilai Mahasiswa</Text>
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
              keyExtractor={(item) => item.id.toString()}
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
  container: {
    flex: 1,
    backgroundColor: "#1a5230",
  },
  safeArea: {
    flex: 1,
  },
  headerBackground: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerBackgroundImage: {
    opacity: 0.15,
  },
  headerOverlay: {
    position: "relative",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(229, 220, 200, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  courseBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2d5f3f",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 12,
  },
  courseBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 13,
    color: "#e5dcc8",
    marginBottom: 12,
  },
  studentCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(229, 220, 200, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  studentCountText: {
    fontSize: 12,
    color: "#2d5f3f",
    marginLeft: 4,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#1a5230",
    paddingTop: 10,
  },
  listHeader: {
    backgroundColor: "#c9b872",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 20,
  },
  listHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d5f3f",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  studentCard: {
    backgroundColor: "#e5dcc8",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#d4cbb8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d2d2d",
    marginBottom: 3,
  },
  studentId: {
    fontSize: 11,
    color: "#5a5a5a",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gradeDisplayContainer: {
    width: 50,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#c9b872",
    justifyContent: "center",
    alignItems: "center",
  },
  gradeDisplayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d5f3f",
  },
  pickerWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c9b872",
    overflow: "hidden",
    width: 30,
    height: 40,
  },
  picker: {
    height: 40,
    width: 70,
    color: "#4a4a4a",
    fontSize: 13,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#e5dcc8",
    fontWeight: "500",
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
    color: "#e5dcc8",
    fontSize: 15,
  },
});
