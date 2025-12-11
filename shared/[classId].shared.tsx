import api from "@/api/axios";
import GenerateScheduleModal from "@/components/class/GenerateScheduleModal";
import CustomAlert from "@/components/CustomAlert";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { ClassDetails } from "@/types/class.types";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "lecturers" | "students";

interface ClassDetailProps {
  viewMode: "admin" | "manager";
  classId: string;
  onBack?: () => void;
  onNavigateAssignMember?: (role: "dosen" | "mahasiswa") => void;
}

export default function ClassDetailScreen({ viewMode, classId, onBack, onNavigateAssignMember }: ClassDetailProps) {
  const { token } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("lecturers");
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate Schedule Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // CustomAlert States
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

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
            onPress: () => isMounted.current && onBack?.(),
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

  const handleGenerateSchedule = useCallback(
    async (startDate: string, jumlahPertemuan: number) => {
      if (!startDate || !jumlahPertemuan) {
        setAlertConfig({
          visible: true,
          title: "Validasi Gagal",
          message: "Tanggal mulai dan jumlah pertemuan harus diisi.",
          type: "error",
        });
        return;
      }

      if (isNaN(jumlahPertemuan) || jumlahPertemuan < 1 || jumlahPertemuan > 20) {
        setAlertConfig({
          visible: true,
          title: "Validasi Gagal",
          message: "Jumlah pertemuan harus antara 1-20.",
          type: "error",
        });
        return;
      }
      try {
        const response = await api.post(`/manager/classes/${classId}/generate-schedule`, {
          start_date: startDate,
          jumlah_pertemuan: jumlahPertemuan,
        });

        if (response.data.status === "success") {
          setShowGenerateModal(false);
          setAlertConfig({
            visible: true,
            title: "Berhasil",
            message: `Berhasil men-generate ${jumlahPertemuan} jadwal pertemuan.`,
            type: "success",
          });
          fetchClassDetails();
        }
      } catch (error: any) {
        console.error("Error generating schedule:", error);

        if (axios.isAxiosError(error) && error.response?.data) {
          const errorData = error.response.data;
          let errorMessage = errorData.message || "Gagal generate jadwal.";

          // Handle validation errors
          if (errorData.errors) {
            const errors = Object.values(errorData.errors).flat();
            errorMessage = errors.join("\n");
          }

          setAlertConfig({
            visible: true,
            title: "Gagal",
            message: errorMessage,
            type: "error",
          });
        } else {
          setAlertConfig({
            visible: true,
            title: "Error",
            message: "Terjadi kesalahan saat generate jadwal.",
            type: "error",
          });
        }
      }
    },
    [classId, fetchClassDetails]
  );

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
            <ThemedText variant="bold" style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase() || "?"}
            </ThemedText>
          </View>
          <View style={styles.memberInfo}>
            <ThemedText variant="semibold" style={styles.memberName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.memberEmail} numberOfLines={1}>
              {item.email}
            </ThemedText>
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
  const totalData = activeTab === "lecturers" ? classDetails?.lecturers || [] : classDetails?.students || [];

  if (isLoading) {
    return (
      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <ThemedText variant="medium" style={styles.loadingText}>
              Memuat detail kelas...
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          {/* Header Modern */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <ThemedText variant="bold" style={styles.headerTitle} numberOfLines={1}>
                {classDetails?.code_class || "Kelas"}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                {classDetails?.subject?.name_subject || ""}
              </ThemedText>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Class Stats Card */}
          {classDetails && (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons name="school-outline" size={18} color="#015023" />
                <View style={styles.statTextContainer}>
                  <ThemedText variant="medium" style={styles.statLabel}>
                    Kapasitas
                  </ThemedText>
                  <ThemedText variant="bold" style={styles.statValue}>
                    {classDetails.member_class}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={18} color="#015023" />
                <View style={styles.statTextContainer}>
                  <ThemedText variant="medium" style={styles.statLabel}>
                    Mahasiswa
                  </ThemedText>
                  <ThemedText variant="bold" style={styles.statValue}>
                    {classDetails.students?.length || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Generate Schedule Button */}
          <View style={styles.generateButtonContainer}>
            <TouchableOpacity onPress={() => setShowGenerateModal(true)} style={styles.generateButton}>
              <Ionicons name="calendar-outline" size={20} color="#015023" />
              <ThemedText variant="bold" style={styles.generateButtonText}>
                Generate Jadwal
              </ThemedText>
            </TouchableOpacity>
          </View>

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
              <ThemedText variant="semibold" style={[styles.tabText, activeTab === "lecturers" && styles.activeTabText]}>
                Dosen ({classDetails?.lecturers?.length || 0})
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab("students");
                setSearchQuery("");
              }}
              style={[styles.tab, activeTab === "students" && styles.activeTab]}
            >
              <Ionicons name="people-outline" size={20} color={activeTab === "students" ? "#015023" : "#9ca3af"} />
              <ThemedText variant="semibold" style={[styles.tabText, activeTab === "students" && styles.activeTabText]}>
                Mahasiswa ({classDetails?.students?.length || 0})
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Search Bar - Always visible when there's data */}
          {totalData.length > 0 && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput style={styles.searchInput} placeholder="Cari nama atau email..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
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
              <Ionicons name={activeTab === "lecturers" ? "person-circle-outline" : "people-outline"} size={48} color="rgba(255, 255, 255, 0.3)" />
              <ThemedText variant="semibold" style={styles.emptyText}>
                {searchQuery ? "Tidak ditemukan" : `Belum ada ${activeTab === "lecturers" ? "dosen" : "mahasiswa"}`}
              </ThemedText>
              {!searchQuery && <ThemedText style={styles.emptySubtext}>Tambahkan {activeTab === "lecturers" ? "dosen" : "mahasiswa"} untuk kelas ini</ThemedText>}
            </View>
          )}

          {/* Action Button */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              onPress={() => {
                const role = activeTab === "lecturers" ? "dosen" : "mahasiswa";
                onNavigateAssignMember?.(role);
              }}
              style={styles.addButton}
            >
              <Ionicons name="add-circle" size={24} color="#015023" />
              <ThemedText variant="bold" style={styles.addButtonText}>
                Tambah {activeTab === "lecturers" ? "Dosen" : "Mahasiswa"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Generate Schedule Modal */}
          <GenerateScheduleModal visible={showGenerateModal} onClose={() => setShowGenerateModal(false)} onGenerate={handleGenerateSchedule} />

          {/* CustomAlert */}
          <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  statsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  },
  statValue: {
    fontSize: 16,
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
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeTab: {
    backgroundColor: "#DABC4E",
    borderWidth: 2,
    borderColor: "#DABC4E",
  },
  tabText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
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
    backgroundColor: "rgba(245, 239, 211, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
    fontFamily: "Urbanist",
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  memberContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DABC4E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  avatarText: {
    fontSize: 16,
    color: "#015023",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
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
    paddingBottom: 220,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 6,
    textAlign: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C352D",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#DABC4E",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 15,
    color: "#015023",
  },
  generateButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#DABC4E",
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    fontSize: 14,
    color: "#015023",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
});
