import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/axios";

export default function GradeInputScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/lecturer/classes/${classId}/students`);
      setStudents(
        response.data.data.map((student) => ({
          ...student,
          // Simpan nilai awal untuk picker
          selectedGrade: student.grade ? student.grade.grade : "",
        }))
      );
    } catch (error) {
      alert("Gagal memuat daftar mahasiswa.");
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
        id_subject: subjectId,
        grade: grade,
      });
      Alert.alert("Sukses", "Nilai berhasil disimpan.");
    } catch (error) {
      Alert.alert("Gagal", "Gagal menyimpan nilai.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
      </View>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={item.selectedGrade} style={styles.picker} onValueChange={(itemValue) => handleGradeChange(item.id, itemValue)}>
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
      <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveGrade(item.id, item.subject_id, item.selectedGrade)}>
        <Ionicons name="save-outline" size={24} color="#015023" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Input Nilai Mahasiswa" }} />
      {isLoading ? (
        <ActivityIndicator size="large" color="#015023" style={{ flex: 1 }} />
      ) : (
        <FlatList data={students} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.container} ListEmptyComponent={<Text style={styles.emptyText}>Belum ada mahasiswa di kelas ini.</Text>} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { padding: 10 },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  studentEmail: {
    fontSize: 12,
    color: "#666",
  },
  pickerContainer: {
    width: 100,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    marginHorizontal: 10,
  },
  picker: {
    height: 40,
  },
  saveButton: {
    padding: 5,
  },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },
});
