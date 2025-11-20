import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

interface Subject {
  id_subject: number;
  name_subject: string;
}

interface AcademicPeriod {
  id_academic_period: number;
  name: string;
}

interface Class {
  id_class: number;
  code_class: string;
  member_class: number;
  id_subject: Subject | number;
  id_academic_period: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAY_NAMES: { [key: number]: string } = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

export default function ClassListScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const isMounted = useRef(true);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    setIsLoadingClasses(true);
    try {
      const subjectsRes = await api.get("/manager/subjects");
      const periodsRes = await api.get("/academic-periods");
      const classesRes = await api.get("/manager/classes");

      if (isMounted.current) {
        setSubjects(subjectsRes.data?.data || subjectsRes.data || []);
        setPeriods(periodsRes.data?.data || periodsRes.data || []);
        setClasses(classesRes.data?.data || classesRes.data || []);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Gagal memuat data: ${error.response?.data?.message || error.message}`
      );
    } finally {
      if (isMounted.current) setIsLoadingClasses(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    Alert.alert("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus kelas ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/manager/classes/${classId}`);
            Alert.alert("Sukses", "Kelas berhasil dihapus.");
            fetchData();
          } catch (error: any) {
            Alert.alert(
              "Gagal",
              error.response?.data?.message ||
                "Terjadi kesalahan saat menghapus kelas."
            );
          }
        },
      },
    ]);
  };

  /*** FIX TERPENTING — agar nama matkul selalu muncul ***/
  const getSubjectName = (subject: Subject | number | string) => {
    try {
      if (typeof subject === "object" && subject !== null) {
        return subject.name_subject || "Tidak diketahui";
      }

      const id = Number(subject);
      const found = subjects.find((s) => s.id_subject === id);

      return found ? found.name_subject : "Tidak diketahui";
    } catch (e) {
      return "Tidak diketahui";
    }
  };

  const getPeriodName = (id_academic_period: number) => {
    const period = periods.find((p) => p.id_academic_period === id_academic_period);
    return period ? period.name : "Tidak diketahui";
  };

  const handleAddClasses = () => {
    if (user?.role === "admin") router.push("/(admin)/AddClasses");
    else if (user?.role === "manager") router.push("/(manager)/AddClasses");
    else Alert.alert("Error", "Role Anda tidak diizinkan untuk menambah kelas.");
  };

  const handleEditClass = (cls: Class) => {
    const editParams = {
      id_class: String(cls.id_class || ""),
      code_class: cls.code_class || "",
      member_class: String(cls.member_class || ""),
      id_subject:
        typeof cls.id_subject === "object"
          ? String(cls.id_subject.id_subject)
          : String(cls.id_subject),
      id_academic_period: String(cls.id_academic_period || ""),
      day_of_week: String(cls.day_of_week || ""),
      start_time: cls.start_time || "",
      end_time: cls.end_time || "",
    };

    router.push({
      pathname: user?.role === "admin" ? "/(admin)/EditClasses" : "/(admin)/EditClasses",
      params: editParams,
    });
  };

  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();

    return (
      cls.code_class.toLowerCase().includes(q) ||
      getSubjectName(cls.id_subject).toLowerCase().includes(q) ||
      getPeriodName(cls.id_academic_period).toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Daftar Kelas",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kelas (kode, mata kuliah)..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Header */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Daftar Kelas</Text>
            <Text style={styles.resultCount}>
              {filteredClasses.length} kelas ditemukan
            </Text>
          </View>
          <TouchableOpacity onPress={handleAddClasses} style={styles.addButton}>
            <Ionicons name="add-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {isLoadingClasses ? (
            <ActivityIndicator size="large" color="#DABC4E" style={styles.loader} />
          ) : filteredClasses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color="#fff" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Tidak ada kelas yang ditemukan"
                  : "Belum ada kelas. Tekan + untuk menambah kelas baru"}
              </Text>
            </View>
          ) : (
            filteredClasses.map((cls) => (
              <View key={cls.id_class} style={styles.classCard}>
                <View style={styles.classCardContent}>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>
                      {getSubjectName(cls.id_subject)}
                    </Text>
                    <Text style={styles.classDetail}>Kelas: {cls.code_class}</Text>
                    <Text style={styles.classDetail}>
                      Periode: {getPeriodName(cls.id_academic_period)}
                    </Text>
                    <Text style={styles.classDetail}>
                      {DAY_NAMES[cls.day_of_week]}, {cls.start_time} - {cls.end_time}
                    </Text>
                    <Text style={styles.classDetail}>
                      Kapasitas: {cls.member_class} mahasiswa
                    </Text>
                  </View>

                  <View style={styles.classActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditClass(cls)}
                    >
                      <Ionicons name="create-outline" size={24} color="#DABC4E" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteClass(cls.id_class)}
                    >
                      <Ionicons name="trash-outline" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#015023" },
  container: { flex: 1, padding: 20, paddingTop: 10 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    paddingBottom: 10,
    marginBottom: 20,
  },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  resultCount: { color: "#FFD43B", fontSize: 14, marginTop: 5 },
  addButton: { padding: 5 },
  listContainer: { flex: 1 },
  loader: { marginTop: 50 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  classCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  classCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  classInfo: { flex: 1 },
  className: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#015023",
    marginBottom: 5,
  },
  classDetail: { fontSize: 14, color: "#666", marginBottom: 3 },
  classActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  editButton: { padding: 8 },
  deleteButton: { padding: 8 },
});
