import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

interface Student {
  id_student: number;
  name: string;
  email: string;
  registration_number: string;
  program_name: string;
}

export default function StudentListScreen() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch students list
  const fetchStudents = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await api.get("/students");
      setStudents(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data mahasiswa:", error);
      Alert.alert("Error", "Gagal mengambil data mahasiswa");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const handleDeleteStudent = useCallback(
    (studentId: number, studentName: string) => {
      Alert.alert(
        "Konfirmasi Hapus",
        `Apakah Anda yakin ingin menghapus mahasiswa "${studentName}"?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await api.delete(`/manager/students/${studentId}`);
                Alert.alert("Sukses", "Data mahasiswa berhasil dihapus.");
                fetchStudents();
              } catch (error) {
                if (axios.isAxiosError(error))
                  console.error("Gagal menghapus mahasiswa:", error.response?.data);
                Alert.alert("Gagal", "Gagal menghapus mahasiswa.");
              }
            },
          },
        ]
      );
    },
    [fetchStudents]
  );

  // Filter search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.registration_number.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  const renderStudentItem = useCallback(
    ({ item }: { item: Student }) => (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.info}>Email: {item.email}</Text>
          <Text style={styles.info}>NIM: {item.registration_number}</Text>
          <Text style={styles.info}>Program: {item.program_name}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#015023" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteStudent(item.id_student, item.name)}
          >
            <Ionicons name="trash-outline" size={22} color="#B00020" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDeleteStudent]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Daftar Mahasiswa",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari mahasiswa (nama, email, NIM)..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Header list */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Daftar Mahasiswa</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.resultCount}>{filteredStudents.length} hasil ditemukan</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(shared)/AddStudent")}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {isLoadingList ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Memuat data...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              renderItem={renderStudentItem}
              keyExtractor={(item) => `student-${item.id_student}`}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name={searchQuery ? "search-outline" : "people-outline"}
                    size={64}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? `Tidak ada mahasiswa yang cocok dengan "${searchQuery}"`
                      : "Belum ada mahasiswa yang ditambahkan."}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { flex: 1, backgroundColor: "#015023", padding: 20 },
  searchContainer: { marginBottom: 20 },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#333" },
  clearButton: { padding: 5 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
  },
  listTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  resultCount: { fontSize: 14, color: "#FFD43B", marginTop: 4 },
  addButton: { padding: 5 },
  listContainer: { flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  info: { fontSize: 14, color: "#555" },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 18,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  loadingText: { marginTop: 10, color: "#fff", fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { textAlign: "center", marginTop: 16, color: "#fff", fontSize: 16 },
});
