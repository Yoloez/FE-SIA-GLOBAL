import api from "@/api/axios";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ListClassesProps {
  viewMode: "admin" | "manager";
  onAddClass?: () => void;
  onEditClass?: (classData: { id_class: string; code_class: string; code_subject: string; name_subject: string; member_class: string; id_academic_period: string; day_of_week: string; start_time: string; end_time: string }) => void;
}

interface Subject {
  id_subject: number;
  name_subject: string;
  sks: number;
}

interface AcademicPeriod {
  id_academic_period: number;
  name: string;
}

interface Class {
  id_class: number;
  code_class: string;
  code_subject: string;
  name_subject: string;
  member_class: number;
  id_academic_period: number;
  academic_period_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  schedule: string;
  total_students: number;
  is_active: number;
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

export default function ClassListScreen({ viewMode, onAddClass, onEditClass }: ListClassesProps) {
  const { token, user } = useAuth();
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isFetchingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      console.log("[ListClasses] Cleanup - unmounting");
      isMounted.current = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const fetchData = async () => {
    console.log("[ListClasses] fetchData called");

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log("[ListClasses] Fetch already in progress, skipping");
      return;
    }

    // Guard: Jangan fetch jika component sudah unmount
    if (!isMounted.current) {
      console.log("[ListClasses] Component unmounted, skipping fetch");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (typeof AbortController !== "undefined") {
      abortControllerRef.current = new AbortController();
    }

    isFetchingRef.current = true;

    if (!isMounted.current) return; // Double check sebelum setState
    setIsLoadingClasses(true);
    try {
      const subjectsRes = await api.get("/manager/subjects", {
        signal: abortControllerRef.current?.signal,
      });
      const periodsRes = await api.get("/academic-periods", {
        signal: abortControllerRef.current?.signal,
      });
      const classesRes = await api.get("/manager/classes", {
        signal: abortControllerRef.current?.signal,
      });

      if (isMounted.current) {
        const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
        const periodsData = periodsRes.data?.data || periodsRes.data || [];
        const classesData = classesRes.data?.data || classesRes.data || [];

        setSubjects(subjectsData);
        setPeriods(periodsData);
        setClasses(classesData);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("Fetch classes data aborted");
        return;
      }

      if (isMounted.current) {
        Alert.alert("Error", `Gagal memuat data: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      if (isMounted.current) setIsLoadingClasses(false);
    }
  };

  // Tidak perlu function getSubjectName karena name_subject sudah ada di class object

  const getPeriodName = (id_academic_period: number) => {
    const period = periods.find((p) => p.id_academic_period === id_academic_period);
    return period ? period.name : "Tidak diketahui";
  };

  const handleAddClasses = () => {
    if (onAddClass) {
      onAddClass();
    } else {
      Alert.alert("Error", "Fungsi tambah kelas tidak tersedia.");
    }
  };

  const handleEditClass = (cls: Class) => {
    if (onEditClass) {
      const editParams = {
        id_class: String(cls.id_class || ""),
        code_class: cls.code_class || "",
        code_subject: cls.code_subject || "",
        name_subject: cls.name_subject || "",
        member_class: String(cls.member_class || ""),
        id_academic_period: String(cls.id_academic_period || ""),
        day_of_week: String(cls.day_of_week || ""),
        start_time: cls.start_time || "",
        end_time: cls.end_time || "",
      };
      onEditClass(editParams);
    } else {
      Alert.alert("Error", "Fungsi edit kelas tidak tersedia.");
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();

    return cls.code_class.toLowerCase().includes(q) || cls.name_subject.toLowerCase().includes(q) || cls.code_subject.toLowerCase().includes(q) || cls.academic_period_name.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Cari kelas (kode, mata kuliah)..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Header */}
        <View style={styles.listHeader}>
          <View>
            <ThemedText variant="bold" style={styles.listTitle}>
              Daftar Kelas
            </ThemedText>
            <ThemedText style={styles.resultCount}>{filteredClasses.length} kelas ditemukan</ThemedText>
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
              <ThemedText style={styles.emptyText}>{searchQuery ? "Tidak ada kelas yang ditemukan" : "Belum ada kelas. Tekan + untuk menambah kelas baru"}</ThemedText>
            </View>
          ) : (
            filteredClasses.map((cls) => (
              <View key={cls.id_class} style={styles.classCard}>
                <View style={styles.classCardContent}>
                  <View style={styles.classInfo}>
                    <ThemedText variant="bold" style={styles.className}>
                      {cls.name_subject}
                    </ThemedText>
                    <ThemedText style={styles.classDetail}>
                      Kode: {cls.code_subject} - Kelas: {cls.code_class}
                    </ThemedText>
                    <ThemedText style={styles.classDetail}>Periode: {cls.academic_period_name}</ThemedText>
                    <ThemedText style={styles.classDetail}>{cls.schedule}</ThemedText>
                    <ThemedText style={styles.classDetail}>
                      Mahasiswa: {cls.total_students}/{cls.member_class}
                    </ThemedText>
                  </View>

                  <View style={styles.classActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditClass(cls)}>
                      <Ionicons name="create-outline" size={24} color="black" />
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
  listTitle: { fontSize: 22, color: "#fff" },
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
    color: "#015023",
    marginBottom: 5,
  },
  classDetail: { fontSize: 14, color: "#666", marginBottom: 3 },
  classActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  editButton: { padding: 8 },
  deleteButton: { padding: 8 },
});
