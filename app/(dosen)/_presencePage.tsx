import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

interface ClassItem {
  no: number;
  id_class: number;
  kode_matkul: string;
  nama_matkul: string;
  sks: number;
  kelas: string;
  dosen: string;
  jumlah_pertemuan: number;
  id_academic_period: number;
  academic_period_name: string;
}

interface AcademicPeriod {
  id: number;
  name: string;
}

export default function PresencePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Fetch classes for attendance
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/lecturer/attendance/classes");
      const fetchedClasses = response.data.data || [];
      setClasses(fetchedClasses);

      // Set default selected period to the first one if available
      if (fetchedClasses.length > 0 && selectedPeriod === null) {
        setSelectedPeriod(fetchedClasses[0].id_academic_period);
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  // Get unique academic periods
  const academicPeriods = useMemo<AcademicPeriod[]>(() => {
    const periodsMap = new Map<number, string>();
    classes.forEach((item) => {
      if (!periodsMap.has(item.id_academic_period)) {
        periodsMap.set(item.id_academic_period, item.academic_period_name);
      }
    });
    return Array.from(periodsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [classes]);

  // Filter classes by selected academic period
  const filteredClasses = useMemo(() => {
    if (selectedPeriod === null) return classes;
    return classes.filter((item) => item.id_academic_period === selectedPeriod);
  }, [classes, selectedPeriod]);

  // Get selected period name
  const selectedPeriodName = useMemo(() => {
    const period = academicPeriods.find((p) => p.id === selectedPeriod);
    return period ? period.name : "Pilih Periode";
  }, [academicPeriods, selectedPeriod]);

  // Navigate to class attendance detail
  const handleClassPress = (classItem: ClassItem) => {
    router.push({
      pathname: "/(dosen)/presensi/detail",
      params: { id_class: classItem.id_class },
    });
  };

  // Handle period selection
  const handlePeriodSelect = (periodId: number) => {
    setSelectedPeriod(periodId);
    setShowPeriodModal(false);
  };

  const renderClassCard = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity style={styles.classCard} onPress={() => handleClassPress(item)} activeOpacity={0.7}>
      {/* Header Card */}
      <View style={styles.cardHeader}>
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText}>{item.kode_matkul}</Text>
        </View>
        <View style={styles.sksChip}>
          <Text style={styles.sksChipText}>{item.sks} SKS</Text>
        </View>
      </View>

      {/* Course Name */}
      <Text style={styles.courseName} numberOfLines={2}>
        {item.nama_matkul}
      </Text>

      {/* Class Code */}
      <View style={styles.infoRow}>
        <Ionicons name="people-outline" size={16} color="#666" />
        <Text style={styles.infoText}>Kelas {item.kelas}</Text>
      </View>

      {/* Meeting Count */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{item.jumlah_pertemuan} Pertemuan</Text>
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowIcon}>
        <Ionicons name="chevron-forward" size={24} color="#015023" />
      </View>
    </TouchableOpacity>
  );

  const renderPeriodModal = () => (
    <Modal visible={showPeriodModal} transparent={true} animationType="fade" onRequestClose={() => setShowPeriodModal(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPeriodModal(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Periode Akademik</Text>
            <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
              <Ionicons name="close" size={24} color="#015023" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.periodList}>
            {academicPeriods.map((period) => (
              <TouchableOpacity key={period.id} style={[styles.periodItem, selectedPeriod === period.id && styles.periodItemSelected]} onPress={() => handlePeriodSelect(period.id)}>
                <Text style={[styles.periodItemText, selectedPeriod === period.id && styles.periodItemTextSelected]}>{period.name}</Text>
                {selectedPeriod === period.id && <Ionicons name="checkmark-circle" size={20} color="#015023" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Presensi Kelas</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Academic Period Filter */}
        {!isLoading && academicPeriods.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.periodSelector} onPress={() => setShowPeriodModal(true)}>
              <View style={styles.periodSelectorContent}>
                <Ionicons name="calendar" size={18} color="#F5EFD3" />
                <Text style={styles.periodSelectorText} numberOfLines={1}>
                  {selectedPeriodName}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#F5EFD3" />
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5EFD3" />
            <Text style={styles.loadingText}>Memuat data kelas...</Text>
          </View>
        ) : (
          <>
            {/* Class List */}
            {filteredClasses.length > 0 ? (
              <FlatList data={filteredClasses} renderItem={renderClassCard} keyExtractor={(item) => item.id_class.toString()} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false} />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>Tidak ada kelas</Text>
                <Text style={styles.emptySubtext}>{selectedPeriod ? "Tidak ada kelas pada periode ini" : "Belum ada kelas yang tersedia"}</Text>
              </View>
            )}
          </>
        )}

        {/* Period Modal */}
        {renderPeriodModal()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  periodSelector: {
    backgroundColor: "rgba(245, 239, 211, 0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(245, 239, 211, 0.3)",
  },
  periodSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  periodSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5EFD3",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#F5EFD3",
    fontWeight: "500",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  classCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  codeChip: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#015023",
  },
  sksChip: {
    backgroundColor: "#015023",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sksChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F5EFD3",
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#015023",
    marginBottom: 12,
    lineHeight: 22,
    paddingRight: 30,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  arrowIcon: {
    position: "absolute",
    right: 18,
    top: "50%",
    marginTop: -12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    width: "85%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(1, 80, 35, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#015023",
  },
  periodList: {
    maxHeight: 400,
  },
  periodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(1, 80, 35, 0.05)",
  },
  periodItemSelected: {
    backgroundColor: "rgba(1, 80, 35, 0.08)",
  },
  periodItemText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  periodItemTextSelected: {
    color: "#015023",
    fontWeight: "700",
  },
});
