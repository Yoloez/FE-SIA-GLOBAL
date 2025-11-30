import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

interface GradeItem {
  id_class: number;
  code_class: string;
  subject_name: string;
  code_subject: string;
  sks: number;
  grade_details: {
    score: number;
    letter: string;
    ip: number;
  } | null;
}

interface GradeSection {
  title: string;
  data: GradeItem[];
}

export default function GradesScreen() {
  const [sections, setSections] = useState<GradeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/student/grades");
      const responseData = response.data.data;
      const gradesData = responseData.grade || {};

      console.log("Grades Response:", response.data);
      console.log("Grades Data:", gradesData);

      // Konversi object ke array (karena Laravel mengembalikan object dengan key numerik)
      let gradesArray: any[] = [];
      if (Array.isArray(gradesData)) {
        gradesArray = gradesData;
      } else if (typeof gradesData === "object" && gradesData !== null) {
        // Konversi object dengan key numerik ke array
        gradesArray = Object.values(gradesData);
      }

      console.log("Converted to Array:", gradesArray);

      if (gradesArray.length === 0) {
        setSections([]);
        return;
      }

      // Kelompokkan data berdasarkan academic_period
      const groupedByPeriod: { [key: string]: GradeItem[] } = {};

      gradesArray.forEach((item: any) => {
        const period = item.academic_period || "Lainnya";
        if (!groupedByPeriod[period]) {
          groupedByPeriod[period] = [];
        }
        groupedByPeriod[period].push(item);
      });

      // Ubah ke format sections
      const sectionsData: GradeSection[] = Object.keys(groupedByPeriod).map((period) => ({
        title: period,
        data: groupedByPeriod[period],
      }));

      setSections(sectionsData);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGrades();
    }, [fetchGrades])
  );

  // Get all period options
  const periodOptions = useMemo(() => {
    if (!Array.isArray(sections)) return ["all"];
    const periods = sections.map((s) => s.title);
    return ["all", ...periods];
  }, [sections]);

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!Array.isArray(sections)) return [];

    if (selectedPeriod === "all") {
      return sections.flatMap((section) => section.data || []);
    }
    const section = sections.find((s) => s.title === selectedPeriod);
    return section ? section.data || [] : [];
  }, [sections, selectedPeriod]);

  // Calculate statistics for filtered data
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

    const ipk = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "0.00";

    return {
      ipk,
      totalSks,
      gradedCount,
      totalCount: filteredData.length,
    };
  }, [filteredData]);

  const renderItem = ({ item, index }: { item: GradeItem; index: number }) => {
    return (
      <View style={styles.row}>
        <View style={styles.rowContent}>
          <View style={styles.subjectInfo}>
            <View style={styles.subjectIconWrapper}>
              <Ionicons name="journal-outline" size={18} color="#015023" />
            </View>
            <View style={styles.subjectTextContainer}>
              <Text style={styles.subjectCode}>{item.code_subject}</Text>
              <Text style={styles.subjectName} numberOfLines={2}>
                {item.subject_name}
              </Text>
            </View>
          </View>
          <View style={styles.gradeBox}>
            <View style={styles.sksChip}>
              <Ionicons name="bookmark-outline" size={12} color="#666" />
              <Text style={styles.sksText}>{item.sks} SKS</Text>
            </View>
            {item.grade_details ? (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreNumber}>{item.grade_details.score}</Text>
                <Text style={styles.scoreText}>{item.grade_details.letter}</Text>
              </View>
            ) : (
              <View style={styles.emptyScoreBadge}>
                <Ionicons name="remove-outline" size={20} color="#ccc" />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getPeriodLabel = (period: string) => {
    if (period === "all") return "Semua Periode";
    return period;
  };

  // Determine label: IPK for "all", IPS for specific period
  const getIndexLabel = () => {
    return selectedPeriod === "all" ? "IPK" : "IPS";
  };

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        {/* Header Summary Card */}
        <View style={styles.headerSummary}>
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <Ionicons name="book-outline" size={20} color="#015023" />
            </View>
            <Text style={styles.summaryLabel}>Total SKS</Text>
            <Text style={styles.summaryValue}>{statistics.totalSks}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <Ionicons name="trophy-outline" size={20} color="#015023" />
            </View>
            <Text style={styles.summaryLabel}>{getIndexLabel()}</Text>
            <Text style={styles.summaryValue}>{statistics.ipk}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#015023" />
            </View>
            <Text style={styles.summaryLabel}>Dinilai</Text>
            <Text style={styles.summaryValue}>
              {statistics.gradedCount}/{statistics.totalCount}
            </Text>
          </View>
        </View>

        {/* Period Filter Dropdown */}
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Ionicons name="funnel-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.filterLabel}>Filter Periode</Text>
          </View>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
            <Text style={styles.dropdownButtonText}>{getPeriodLabel(selectedPeriod)}</Text>
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Dropdown Options */}
        {showDropdown && (
          <View style={styles.dropdownList}>
            {periodOptions.map((period, index) => (
              <TouchableOpacity
                key={period}
                style={[styles.dropdownItem, selectedPeriod === period && styles.dropdownItemActive, index === periodOptions.length - 1 && styles.dropdownItemLast]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setShowDropdown(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownItemText, selectedPeriod === period && styles.dropdownItemTextActive]}>{getPeriodLabel(period)}</Text>
                {selectedPeriod === period && <Ionicons name="checkmark-circle" size={22} color="#015023" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Memuat data nilai...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id_class}-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.4)" />
                </View>
                <Text style={styles.emptyText}>{selectedPeriod === "all" ? "Belum ada data akademik" : `Tidak ada mata kuliah di periode ${selectedPeriod}`}</Text>
                <Text style={styles.emptySubtext}>Data nilai akan muncul setelah dosen menginput nilai</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerSummary: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statItem: { alignItems: "center", flex: 1, paddingVertical: 8 },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    // paddingVertical: 15,
    // paddingTop: 30,
    marginTop: 20,
  },
  backButton: {
    width: 35,
  },
  summaryLabel: {
    color: "#666",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  summaryValue: { color: "#015023", fontSize: 24, fontWeight: "800" },
  divider: { width: 1, height: 60, backgroundColor: "rgba(1, 80, 35, 0.15)" },
  filterContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 10,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  filterLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "600", letterSpacing: 0.3 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dropdownButtonText: { fontSize: 15, color: "rgba(255,255,255,0.95)", fontWeight: "600" },
  dropdownList: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 20,
    marginTop: -8,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
    maxHeight: 300,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemActive: { backgroundColor: "rgba(1, 80, 35, 0.08)" },
  dropdownItemText: { fontSize: 15, color: "#333", fontWeight: "500" },
  dropdownItemTextActive: { fontWeight: "700", color: "#015023" },
  listContainer: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  row: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rowContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  subjectInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectCode: { fontSize: 11, color: "#666", marginBottom: 4, fontWeight: "600", letterSpacing: 0.3 },
  subjectName: { fontSize: 15, color: "#333", fontWeight: "600", lineHeight: 20 },
  gradeBox: { alignItems: "flex-end", gap: 8 },
  sksChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sksText: { fontSize: 11, color: "#666", fontWeight: "600" },
  scoreBadge: {
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 64,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(1, 80, 35, 0.2)",
  },
  scoreNumber: { fontSize: 20, fontWeight: "800", color: "#015023", marginBottom: 2 },
  scoreText: { fontSize: 13, fontWeight: "700", color: "#2e7d32", letterSpacing: 0.5 },
  emptyScoreBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 64,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  loadingText: { marginTop: 16, fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
});
