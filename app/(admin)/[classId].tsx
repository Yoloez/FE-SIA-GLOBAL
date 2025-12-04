import api from "@/api/axios";
import { ClassDetails } from "@/types/class.types";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
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

  // Generate Schedule Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [jumlahPertemuan, setJumlahPertemuan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateSchedule = useCallback(async () => {
    if (!startDate || !jumlahPertemuan) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Tanggal mulai dan jumlah pertemuan harus diisi.",
        type: "error",
      });
      return;
    }

    const jumlah = parseInt(jumlahPertemuan);
    if (isNaN(jumlah) || jumlah < 1 || jumlah > 20) {
      setAlertConfig({
        visible: true,
        title: "Validasi Gagal",
        message: "Jumlah pertemuan harus antara 1-20.",
        type: "error",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post(`/manager/classes/${classId}/generate-schedule`, {
        start_date: startDate,
        jumlah_pertemuan: jumlah,
      });

      if (response.data.status === "success") {
        setShowGenerateModal(false);
        setStartDate("");
        setJumlahPertemuan("");
        setAlertConfig({
          visible: true,
          title: "Berhasil",
          message: `Berhasil men-generate ${jumlah} jadwal pertemuan.`,
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
    } finally {
      setIsGenerating(false);
    }
  }, [classId, startDate, jumlahPertemuan, fetchClassDetails]);

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
      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <Text style={styles.loadingText}>Memuat detail kelas...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
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

        {/* Generate Schedule Button */}
        <View style={styles.generateButtonContainer}>
          <TouchableOpacity onPress={() => setShowGenerateModal(true)} style={styles.generateButton}>
            <Ionicons name="calendar-outline" size={20} color="#015023" />
            <Text style={styles.generateButtonText}>Generate Jadwal</Text>
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

        {/* Generate Schedule Modal */}
        <Modal visible={showGenerateModal} transparent animationType="fade" onRequestClose={() => setShowGenerateModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Generate Jadwal Pertemuan</Text>
                <TouchableOpacity onPress={() => setShowGenerateModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalDescription}>Generate jadwal pertemuan otomatis berdasarkan hari dan jam kelas.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tanggal Mulai</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <TextInput style={styles.modalInput} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" value={startDate} onChangeText={setStartDate} />
                  </View>
                  <Text style={styles.inputHint}>Format: 2025-01-15 (harus sesuai hari kelas)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Jumlah Pertemuan</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="repeat-outline" size={20} color="#666" />
                    <TextInput style={styles.modalInput} placeholder="1-20" placeholderTextColor="#9ca3af" value={jumlahPertemuan} onChangeText={setJumlahPertemuan} keyboardType="number-pad" />
                  </View>
                  <Text style={styles.inputHint}>Minimal 1, maksimal 20 pertemuan</Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setShowGenerateModal(false)} style={styles.modalCancelButton} disabled={isGenerating}>
                  <Text style={styles.modalCancelText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleGenerateSchedule} style={[styles.modalGenerateButton, isGenerating && styles.modalGenerateButtonDisabled]} disabled={isGenerating}>
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#015023" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#015023" />
                      <Text style={styles.modalGenerateText}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* CustomAlert */}
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  activeTabText: {
    color: "#015023",
    fontWeight: "700",
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(1, 80, 35, 0.95)",
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
    fontWeight: "700",
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
    fontWeight: "500",
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
    fontWeight: "700",
    color: "#015023",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#015023",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    gap: 8,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  inputHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalGenerateButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#DABC4E",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalGenerateButtonDisabled: {
    opacity: 0.6,
  },
  modalGenerateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#015023",
  },
});
