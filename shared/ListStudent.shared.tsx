import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Student {
  id_user_si: number;
  username: string;
  email: string;
  full_name: string;
  registration_number: string | null;
  registration_status: string | null;
  program_name: string;
  profile_image: string | null;
  is_active: boolean;
}

interface ListStudentProps {
  viewMode: "admin" | "manager";
  onAddStudent?: () => void;
  onEditStudent?: (studentData: any) => void;
}

export default function StudentListScreen({ viewMode, onAddStudent, onEditStudent }: ListStudentProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isFetchingRef = React.useRef(false);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      console.log("[ListStudent] Cleanup - unmounting");
      isMountedRef.current = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Fetch students list - STABLE reference with empty deps
  const fetchStudents = useCallback(async () => {
    console.log("[ListStudent] fetchStudents called");

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log("[ListStudent] Fetch already in progress, skipping");
      return;
    }

    if (!isMountedRef.current) {
      console.log("[ListStudent] Component unmounted, skipping fetch");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (typeof AbortController !== "undefined") {
      abortControllerRef.current = new AbortController();
    }

    isFetchingRef.current = true;

    try {
      if (isMountedRef.current) {
        setIsLoadingList(true);
      }

      const response = await api.get("/manager/students", {
        signal: abortControllerRef.current?.signal,
      });
      console.log("[ListStudent] Response received:", response.data?.data?.length || 0, "students");

      if (isMountedRef.current) {
        setStudents(response.data.data || []);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("[ListStudent] Fetch aborted");
        return;
      }

      console.error("[ListStudent] Gagal mengambil data mahasiswa:", error);
      if (axios.isAxiosError(error)) {
        console.error("[ListStudent] Error response:", error.response?.data);
      }

      if (isMountedRef.current) {
        Alert.alert("Error", "Gagal mengambil data mahasiswa");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingList(false);
      }
      isFetchingRef.current = false;
      console.log("[ListStudent] Fetch completed");
    }
  }, []); // EMPTY deps - stable reference!

  // FIXED: useFocusEffect with EMPTY deps to prevent infinite loop
  useFocusEffect(
    useCallback(() => {
      console.log("[ListStudent] useFocusEffect triggered");
      if (isMountedRef.current && !isFetchingRef.current) {
        fetchStudents();
      }
      // fetchStudents has STABLE reference, so this callback is also stable
    }, []) // EMPTY deps - no re-creation!
  );

  const handleToggleStatus = useCallback((studentId: number, studentName: string, currentStatus: boolean) => {
    if (!isMountedRef.current) {
      console.warn("[ListStudent] Component unmounted, toggle cancelled");
      return;
    }

    const newStatus = currentStatus ? "nonaktif" : "aktif";
    const statusMessage = currentStatus ? `Nonaktifkan mahasiswa "${studentName}"?` : `Aktifkan mahasiswa "${studentName}"?`;

    Alert.alert("Konfirmasi Ubah Status", statusMessage, [
      { text: "Batal", style: "cancel" },
      {
        text: "Ubah",
        style: "default",
        onPress: async () => {
          if (!isMountedRef.current) return;

          setTogglingId(studentId);
          try {
            const response = await api.patch(`/manager/users/${studentId}/toggle-status`);

            if (!isMountedRef.current) return;

            if (response.data.status === "success") {
              // Update local state
              setStudents((prevStudents) => prevStudents.map((student) => (student.id_user_si === studentId ? { ...student, is_active: !student.is_active } : student)));
              Alert.alert("Sukses", `Status mahasiswa berhasil diubah menjadi ${newStatus}.`);
            } else {
              Alert.alert("Gagal", response.data.message || "Gagal mengubah status mahasiswa.");
            }
          } catch (error) {
            console.error("Gagal mengubah status:", error);
            if (!isMountedRef.current) return;

            if (axios.isAxiosError(error)) {
              console.error("Error response:", error.response?.data);
              Alert.alert("Gagal", error.response?.data?.message || "Gagal mengubah status mahasiswa.");
            } else {
              Alert.alert("Gagal", "Gagal mengubah status mahasiswa.");
            }
          } finally {
            if (isMountedRef.current) {
              setTogglingId(null);
            }
          }
        },
      },
    ]);
  }, []);

  // Filter search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.registration_number && s.registration_number.toLowerCase().includes(q)) || s.username.toLowerCase().includes(q));
  }, [students, searchQuery]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  const renderStudentItem = useCallback(
    ({ item }: { item: Student }) => (
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={28} color="#999" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.info}>Email: {item.email}</Text>
          {item.registration_number && <Text style={styles.info}>NIM: {item.registration_number}</Text>}
          <Text style={styles.info}>Program: {item.program_name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
              <Ionicons name={item.is_active ? "checkmark-circle" : "close-circle"} size={14} color="#fff" style={styles.statusIcon} />
              <Text style={styles.statusText}>{item.is_active ? "Aktif" : "Nonaktif"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (onEditStudent) {
                onEditStudent({
                  id: item.id_user_si,
                  full_name: item.full_name,
                  nim: item.registration_number,
                  email: item.email,
                  program: item.program_name,
                  image: item.profile_image,
                });
              }
            }}
          >
            <Ionicons name="create-outline" size={22} color="#015023" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, togglingId === item.id_user_si && styles.actionButtonLoading]}
            onPress={() => handleToggleStatus(item.id_user_si, item.full_name, item.is_active)}
            disabled={togglingId === item.id_user_si}
          >
            {togglingId === item.id_user_si ? <ActivityIndicator size="small" color="#015023" /> : <Ionicons name={item.is_active ? "power" : "power-outline"} size={22} color={item.is_active ? "#4CAF50" : "#F44336"} />}
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleToggleStatus, onEditStudent, togglingId]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Cari mahasiswa (nama, email, NIM, username)..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} />
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
            {searchQuery.length > 0 && <Text style={styles.resultCount}>{filteredStudents.length} hasil ditemukan</Text>}
          </View>

          <TouchableOpacity onPress={() => onAddStudent?.()} style={styles.addButton}>
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
              keyExtractor={(item) => `student-${item.id_user_si}`}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name={searchQuery ? "search-outline" : "people-outline"} size={64} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.emptyText}>{searchQuery ? `Tidak ada mahasiswa yang cocok dengan "${searchQuery}"` : "Belum ada mahasiswa yang ditambahkan."}</Text>
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
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  info: { fontSize: 13, color: "#555", marginBottom: 2 },
  statusContainer: { marginTop: 4 },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: "#4CAF50" },
  statusInactive: { backgroundColor: "#F44336" },
  statusIcon: { marginRight: 4 },
  statusText: { fontSize: 12, color: "#fff", fontWeight: "600", textTransform: "uppercase" },
  actions: { flexDirection: "column", gap: 8, marginLeft: 8 },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 18,
  },
  actionButtonLoading: {
    backgroundColor: "rgba(200,200,200,0.5)",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  loadingText: { marginTop: 10, color: "#fff", fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { textAlign: "center", marginTop: 16, color: "#fff", fontSize: 16, paddingHorizontal: 20 },
});
