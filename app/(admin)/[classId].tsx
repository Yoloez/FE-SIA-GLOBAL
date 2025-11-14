import api from "@/api/axios";
import { ClassDetails } from "@/types/class.types";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

type TabType = "lecturers" | "students";

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { token } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("lecturers");
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchClassDetails = useCallback(async () => {
    if (!token || !classId) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    if (isMounted.current) setIsLoading(true);

    try {
      const response = await api.get(`/manager/classes/${classId}`, {
        signal: abortControllerRef.current.signal,
      });
      if (isMounted.current) setClassDetails(response.data.data);
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") return;

      if (isMounted.current) {
        console.error("Error fetching class details:", error);
        Alert.alert("Error", "Gagal memuat detail kelas.", [
          {
            text: "OK",
            onPress: () => isMounted.current && router.back(),
          },
        ]);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [classId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchClassDetails();
      return () => abortControllerRef.current?.abort();
    }, [fetchClassDetails])
  );

  const filteredData = useMemo(() => {
    if (!classDetails) return { lecturers: [], students: [] };

    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return {
        lecturers: classDetails.lecturers || [],
        students: classDetails.students || [],
      };
    }

    const filterByQuery = (user: any) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);

    return {
      lecturers: (classDetails.lecturers || []).filter(filterByQuery),
      students: (classDetails.students || []).filter(filterByQuery),
    };
  }, [classDetails, searchQuery]);

  const handleRemoveMember = useCallback(
    (memberId: number, memberName: string, role: "dosen" | "mahasiswa") => {
      if (!isMounted.current) return;

      const endpoint = role === "dosen" ? "lecturers" : "students";
      const roleName = role === "dosen" ? "Dosen" : "Mahasiswa";

      Alert.alert(`Keluarkan ${roleName}`, `Apakah Anda yakin ingin mengeluarkan "${memberName}" dari kelas ini?`, [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluarkan",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/manager/classes/${classId}/${endpoint}/${memberId}`);
              if (isMounted.current) {
                Alert.alert("Sukses", `${roleName} berhasil dikeluarkan.`);
                fetchClassDetails();
              }
            } catch (error) {
              if (axios.isAxiosError(error)) console.error(`Gagal mengeluarkan ${role}:`, error.response?.data);
              if (isMounted.current) Alert.alert("Gagal", `Gagal mengeluarkan ${roleName}.`);
            }
          },
        },
      ]);
    },
    [classId, fetchClassDetails]
  );

  const renderMemberItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.memberItem}>
        <View style={styles.memberContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || "?"}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.memberEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            const role = activeTab === "lecturers" ? "dosen" : "mahasiswa";
            handleRemoveMember(item.id_user_si || item.id, item.name, role);
          }}
          style={styles.deleteButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
    ),
    [activeTab, handleRemoveMember]
  );

  const currentData = activeTab === "lecturers" ? filteredData.lecturers : filteredData.students;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#015023" />
          <Text style={styles.loadingText}>Memuat detail kelas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header Modern */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#015023" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {classDetails?.code_class || "Kelas"}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {classDetails?.subject?.name_subject || ""}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Class Stats Card */}
      {classDetails && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="school-outline" size={18} color="#015023" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Kapasitas</Text>
              <Text style={styles.statValue}>{classDetails.member_class}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={18} color="#015023" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Mahasiswa</Text>
              <Text style={styles.statValue}>{classDetails.students?.length || 0}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab("lecturers");
            setSearchQuery("");
          }}
          style={[styles.tab, activeTab === "lecturers" && styles.activeTab]}
        >
          <Ionicons name="person-circle-outline" size={20} color={activeTab === "lecturers" ? "#015023" : "#9ca3af"} />
          <Text style={[styles.tabText, activeTab === "lecturers" && styles.activeTabText]}>Dosen ({classDetails?.lecturers?.length || 0})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab("students");
            setSearchQuery("");
          }}
          style={[styles.tab, activeTab === "students" && styles.activeTab]}
        >
          <Ionicons name="people-outline" size={20} color={activeTab === "students" ? "#015023" : "#9ca3af"} />
          <Text style={[styles.tabText, activeTab === "students" && styles.activeTabText]}>Mahasiswa ({classDetails?.students?.length || 0})</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {currentData.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Cari nama atau email..." placeholderTextColor="#d1d5db" value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Members List */}
      {currentData.length > 0 ? (
        <FlatList
          data={currentData}
          renderItem={renderMemberItem}
          keyExtractor={(item, index) => `${activeTab}-${item.id_user_si}-${index}`}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name={activeTab === "lecturers" ? "person-circle-outline" : "people-outline"} size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>{searchQuery ? "Tidak ditemukan" : `Belum ada ${activeTab === "lecturers" ? "dosen" : "mahasiswa"}`}</Text>
          <Text style={styles.emptySubtext}>{!searchQuery && `Tambahkan ${activeTab === "lecturers" ? "dosen" : "mahasiswa"} untuk kelas ini`}</Text>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "./AssignMember",
              params: {
                classId,
                role: activeTab === "lecturers" ? "dosen" : "mahasiswa",
              },
            })
          }
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Tambah {activeTab === "lecturers" ? "Dosen" : "Mahasiswa"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  statsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statTextContainer: {
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#015023",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#d1d5db",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#ecfdf5",
    borderWidth: 2,
    borderColor: "#10b981",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#015023",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  memberContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#015023",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  memberEmail: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#d1d5db",
    marginTop: 6,
    textAlign: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#015023",
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
});
