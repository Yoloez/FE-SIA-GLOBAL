import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface GradeItem {
  id_class: number;
  code_class: string;
  subject_name: string;
  code_subject: string;
  sks: number;
  academic_period: string;
  grade_details: {
    score: number;
    letter: string;
    ip: number;
  } | null;
}

interface AcademicPeriod {
  id: string;
  name: string;
}

export default function GradesScreen() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "results">("results");

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/student/grades");
      const responseData = response.data.data;
      const gradesData = responseData.grade || {};

      let gradesArray: any[] = [];
      if (Array.isArray(gradesData)) {
        gradesArray = gradesData;
      } else if (typeof gradesData === "object" && gradesData !== null) {
        gradesArray = Object.values(gradesData);
      }

      setGrades(gradesArray);

      // Set default selected period to the first one if available
      if (gradesArray.length > 0 && selectedPeriod === null) {
        const firstPeriod = gradesArray[0].academic_period;
        setSelectedPeriod(firstPeriod);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchGrades();
    }, [fetchGrades])
  );

  // Get unique academic periods
  const academicPeriods = useMemo<AcademicPeriod[]>(() => {
    const periodsMap = new Map<string, string>();
    grades.forEach((item) => {
      const period = item.academic_period || "Lainnya";
      if (!periodsMap.has(period)) {
        periodsMap.set(period, period);
      }
    });
    return Array.from(periodsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [grades]);

  // Filter grades by selected academic period
  const filteredData = useMemo(() => {
    if (selectedPeriod === null) return grades;
    return grades.filter((item) => item.academic_period === selectedPeriod);
  }, [grades, selectedPeriod]);

  // Get selected period name
  const selectedPeriodName = useMemo(() => {
    const period = academicPeriods.find((p) => p.id === selectedPeriod);
    return period ? period.name : "Pilih Periode";
  }, [academicPeriods, selectedPeriod]);

  // Handle period selection
  const handlePeriodSelect = (periodId: string) => {
    setSelectedPeriod(periodId);
    setShowPeriodModal(false);
  };

  const statistics = useMemo(() => {
    let totalSks = 0;
    let totalBobot = 0;
    let gradedCount = 0;

    filteredData.forEach((item) => {
      if (item.grade_details) {
        const sks = item.sks;
        const ip = item.grade_details.ip;
        totalSks += sks;
        totalBobot += sks * ip;
        gradedCount++;
      }
    });

    const ips = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "0.00";

    // Calculate IPK (all periods)
    let totalSksAll = 0;
    let totalBobotAll = 0;

    grades.forEach((item) => {
      if (item.grade_details) {
        totalSksAll += item.sks;
        totalBobotAll += item.sks * item.grade_details.ip;
      }
    });

    const ipk = totalSksAll > 0 ? (totalBobotAll / totalSksAll).toFixed(2) : "0.00";

    return {
      ips,
      ipk,
      totalSks,
      gradedCount,
      totalCount: filteredData.length,
    };
  }, [filteredData, grades]);

  const renderGradeCard = ({ item, index }: { item: GradeItem; index: number }) => {
    return (
      <View style={styles.gradeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.codeChip}>
              <Text style={styles.codeChipText}>{item.code_subject}</Text>
            </View>
            <View style={styles.sksChipSmall}>
              <Text style={styles.sksChipText}>SKS: {item.sks}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuIcon}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subjectTitle} numberOfLines={2}>
          {item.subject_name}
        </Text>
        <Text style={styles.classCode}>Class: {item.code_class}</Text>

        <View style={styles.gradeFooter}>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>Nilai</Text>
            <Text style={styles.gradeValueLarge}>{item.grade_details ? item.grade_details.letter : "-"}</Text>
          </View>

          <View style={styles.gradeDivider} />

          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>Skor</Text>
            <Text style={styles.gradeValue}>{item.grade_details ? item.grade_details.score.toFixed(2) : "-"}</Text>
          </View>
        </View>
      </View>
    );
  };

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
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Study</Text>
              <Text style={styles.headerSubtitle}>{selectedPeriodName}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === "plan" && styles.tabActive]} onPress={() => setActiveTab("plan")}>
            <Text style={[styles.tabText, activeTab === "plan" && styles.tabTextActive]}>Study Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "results" && styles.tabActive]} onPress={() => setActiveTab("results")}>
            <Text style={[styles.tabText, activeTab === "results" && styles.tabTextActive]}>Study Results</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={16} color="#015023" />
              </View>
              <View>
                <Text style={styles.statLabel}>SKS</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{statistics.totalSks} SKS</Text>
                </View>
              </View>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={16} color="#015023" />
              </View>
              <View>
                <Text style={styles.statLabel}>IPK</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{statistics.ipk}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={16} color="#015023" />
              </View>
              <View>
                <Text style={styles.statLabel}>IPS</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{statistics.ips}</Text>
                </View>
              </View>
            </View>
          </View>
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

        {/* Grade Cards List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <Text style={styles.loadingText}>Loading grades...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderGradeCard}
            keyExtractor={(item, index) => `${item.id_class}-${index}`}
            contentContainerStyle={styles.gradesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>No grades available</Text>
                <Text style={styles.emptySubtext}>{selectedPeriod ? "No grades available for this period" : "Grades will appear here once your lecturers input them"}</Text>
              </View>
            }
          />
        )}

        {/* Period Modal */}
        {renderPeriodModal()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#DABC4E",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  tabTextActive: {
    color: "#015023",
  },
  userCard: {
    backgroundColor: "#F5EFD3",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "black",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 12,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DABC4E",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  gradesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  gradeCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "black",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    gap: 8,
  },
  codeChip: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codeChipText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#015023",
  },
  sksChipSmall: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sksChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  menuIcon: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  classCode: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  gradeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  gradeItem: {
    flex: 1,
    alignItems: "center",
  },
  gradeLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 6,
  },
  gradeValueLarge: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#015023",
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  gradeDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
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
