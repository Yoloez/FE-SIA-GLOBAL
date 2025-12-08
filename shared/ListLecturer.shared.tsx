import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ListLecturerProps {
  viewMode: "admin" | "manager";
  onAddLecturer?: () => void;
  onEditLecturer?: (lecturerData: { id: number; name: string; nip: string; email: string; image: string }) => void;
  onBack?: () => void;
}

interface Lecturer {
  id_user_si: number;
  name: string;
  email: string;
  username?: string;
  profile_image?: string;
  employee_id_number?: string;
  is_active: boolean;
}

export default function ListLecturerScreen({ viewMode, onAddLecturer, onEditLecturer, onBack }: ListLecturerProps) {
  const { token } = useAuth();

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<Lecturer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isFetchingRef = React.useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLecturers();

    return () => {
      console.log("[ListLecturer] Cleanup - unmounting");
      isMountedRef.current = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
      filterLecturers();
    }
  }, [searchQuery, lecturers]);

  const fetchLecturers = async () => {
    console.log("[ListLecturer] fetchLecturers called");

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log("[ListLecturer] Fetch already in progress, skipping");
      return;
    }

    if (!isMountedRef.current) {
      console.log("[ListLecturer] Component unmounted, skipping fetch");
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
        setIsLoading(true);
      }

      const response = await api.get("/manager/lecturers", {
        signal: abortControllerRef.current?.signal,
      });
      console.log("[ListLecturer] Response received:", response.data?.data?.length || 0, "lecturers");

      if (isMountedRef.current) {
        setLecturers(response.data.data || []);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("[ListLecturer] Fetch aborted");
        return;
      }

      console.error("[ListLecturer] Error fetching lecturers:", error);
      if (isMountedRef.current) {
        Alert.alert("Error", "Gagal memuat daftar dosen.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
      isFetchingRef.current = false;
      console.log("[ListLecturer] Fetch completed");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLecturers();
  };

  const filterLecturers = () => {
    if (!searchQuery.trim()) {
      setFilteredLecturers(lecturers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = lecturers.filter((lecturer) => lecturer.name.toLowerCase().includes(query) || lecturer.email.toLowerCase().includes(query) || (lecturer.employee_id_number && lecturer.employee_id_number.toLowerCase().includes(query)));
    setFilteredLecturers(filtered);
  };

  const handleEditLecturer = (lecturer: Lecturer) => {
    if (onEditLecturer) {
      onEditLecturer({
        id: lecturer.id_user_si,
        name: lecturer.name,
        nip: lecturer.employee_id_number || "",
        email: lecturer.email,
        image: lecturer.profile_image || "",
      });
    } else {
      Alert.alert("Error", "Fungsi edit tidak tersedia.");
    }
  };
  const handleAddLecturer = () => {
    if (onAddLecturer) {
      onAddLecturer();
    } else {
      Alert.alert("Error", "Fungsi tambah tidak tersedia.");
    }
  };

  const handleToggleStatus = useCallback(
    (lecturer: Lecturer) => {
      const newStatus = lecturer.is_active ? "nonaktif" : "aktif";
      const statusMessage = lecturer.is_active ? `Nonaktifkan dosen "${lecturer.name}"?` : `Aktifkan dosen "${lecturer.name}"?`;

      Alert.alert("Konfirmasi Ubah Status", statusMessage, [
        { text: "Batal", style: "cancel" },
        {
          text: "Ubah",
          style: "default",
          onPress: async () => {
            if (!isMountedRef.current) return;

            setTogglingId(lecturer.id_user_si);
            try {
              const response = await api.patch(`/manager/users/${lecturer.id_user_si}/toggle-status`);

              if (!isMountedRef.current) return;

              if (response.data.status === "success") {
                setLecturers((prevLecturers) => prevLecturers.map((lect) => (lect.id_user_si === lecturer.id_user_si ? { ...lect, is_active: !lect.is_active } : lect)));
                Alert.alert("Sukses", `Status dosen berhasil diubah menjadi ${newStatus}.`);
              } else {
                Alert.alert("Gagal", response.data.message || "Gagal mengubah status dosen.");
              }
            } catch (error) {
              console.error("Error toggling lecturer status:", error);
              if (isMountedRef.current) {
                Alert.alert("Gagal", "Gagal mengubah status dosen.");
              }
            } finally {
              if (isMountedRef.current) {
                setTogglingId(null);
              }
            }
          },
        },
      ]);
    },
    [viewMode]
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchLecturers();
  //   }, [fetchLecturers])
  // );

  const renderLecturerItem = ({ item }: { item: Lecturer }) => (
    <View style={styles.lecturerCard}>
      <View style={styles.lecturerContent}>
        <View style={styles.avatarContainer}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
        </View>

        <View style={styles.lecturerInfo}>
          <Text style={styles.lecturerName}>{item.name}</Text>
          <Text style={styles.lecturerEmail}>{item.email}</Text>
          {item.employee_id_number && <Text style={styles.lecturerNip}>NIP: {item.employee_id_number}</Text>}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
              <Ionicons name={item.is_active ? "checkmark-circle" : "close-circle"} size={12} color="#fff" style={styles.statusIcon} />
              <Text style={styles.statusText}>{item.is_active ? "Aktif" : "Nonaktif"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleEditLecturer(item)}>
            <Ionicons name="create-outline" size={26} color="#015023" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconButton, togglingId === item.id_user_si && styles.iconButtonLoading]} onPress={() => handleToggleStatus(item)} disabled={togglingId === item.id_user_si}>
            {togglingId === item.id_user_si ? <ActivityIndicator size="small" color="#015023" /> : <Ionicons name={item.is_active ? "power" : "power-outline"} size={26} color={item.is_active ? "#4CAF50" : "#F44336"} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#999" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Cari Dosen (nama, email, NIP)..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Header list */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Daftar Dosen</Text>
          <TouchableOpacity onPress={handleAddLecturer} style={styles.addButton}>
            <Ionicons name="add-circle" size={40} color="#ffffffff" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* List Dosen */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <Text style={styles.loadingText}>Memuat daftar dosen...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLecturers}
            renderItem={renderLecturerItem}
            keyExtractor={(item) => item.id_user_si.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffffff" />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.4)" />
                <Text style={styles.emptyText}>{searchQuery ? "Tidak ada dosen yang sesuai pencarian" : "Belum ada dosen. Tekan tombol + untuk menambahkan."}</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#015023",
  },
  container: {
    flex: 1,
    backgroundColor: "#015023",
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 56,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },
  addButton: {
    padding: 4,
  },
  divider: {
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  lecturerCard: {
    backgroundColor: "#F5E6C8",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lecturerContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  lecturerInfo: {
    flex: 1,
  },
  lecturerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  lecturerEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  lecturerNip: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: "#F44336",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonLoading: {
    backgroundColor: "rgba(200,200,200,0.3)",
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});
